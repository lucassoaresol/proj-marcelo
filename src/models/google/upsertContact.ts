import { env } from "../../config/env";
import databaseContactPromise from "../../db/contact";
import dayLib from "../../libs/dayjs";
import notion from "../../libs/notion";
import { IContactRecord } from "./types";

const nameMap = {
  givenName: "First Name",
  middleName: "Middle Name",
  familyName: "Last Name",
  phoneticGivenName: "Phonetic First Name",
  phoneticMiddleName: "Phonetic Middle Name",
  phoneticFamilyName: "Phonetic Last Name",
  honorificPrefix: "Name Prefix",
  honorificSuffix: "Name Suffix",
} as const;

type ContactName = Partial<Record<keyof typeof nameMap, string>>;

const organizationMap = {
  name: "Organization Name",
  title: "Organization Title",
  department: "Organization Department"
} as const;

type ContactOrganization = Partial<Record<keyof typeof organizationMap, string>>;

type IndexedKeys<B extends string, S extends string> = `${B} ${number} - ${S}`;

type Data = Partial<Record<(typeof nameMap)[keyof typeof nameMap], string | undefined>> & { Nickname?: string, Birthday?: string, Notes?: string, Photo?: string, "Concat - Variável"?: string } & Partial<Record<(typeof organizationMap)[keyof typeof organizationMap], string | undefined>> & Partial<Record<
  | IndexedKeys<"E - mail", "Label" | "Value">
  | IndexedKeys<"Phone", "Label" | "Value"> | IndexedKeys<"Address", "Label" | "Formatted" | "Street" | "City" | "PO Box" | "Region" | "Postal Code" | "Country" | "Extended Address"> | IndexedKeys<"Relation", "Label" | "Value"> | IndexedKeys<"Website", "Label" | "Value"> | IndexedKeys<"Event", "Label" | "Value"> | IndexedKeys<"Custom Field", "Label" | "Value">,
  string
>>

function extractTags(input: string): string[] {
  if (input.match(/\[[^\]]+\]/g)) {
    return (
      input
        .match(/\[([^\]]+)\]/g)
        ?.map((match) => match.slice(1, -1).toUpperCase()) || []
    );
  }

  const regex = /^\[([^\]]+)\]$/;
  const match = input.match(regex);
  if (match) {
    return match[1].split(",").map((value) => value.trim().toUpperCase());
  }

  return [];
}


type PropertiesCache = Record<string, unknown>;

async function ensureRichTextProp(
  dataSourceId: string,
  propsCache: PropertiesCache,
  propName: string
) {
  if (!(propName in propsCache)) {
    await notion.dataSources.update({
      data_source_id: dataSourceId,
      properties: { [propName]: { rich_text: {} } },
    });
    propsCache[propName] = { rich_text: {} };
  }
}

async function ensurePhoneProp(dataSourceId: string, propsCache: PropertiesCache, propName: string) {
  if (!(propName in propsCache)) {
    await notion.dataSources.update({
      data_source_id: dataSourceId,
      properties: { [propName]: { phone_number: {} } },
    });
    propsCache[propName] = { phone_number: {} };
  }
}

async function setRichText(
  properties: any,
  dataSourceId: string,
  propsCache: PropertiesCache,
  propName: string,
  value?: string
) {
  if (!value) return;
  await ensureRichTextProp(dataSourceId, propsCache, propName);

  properties[propName] = { rich_text: splitByLastSemicolon(value, 2000).map(part => ({ text: { content: part } })) };
}

async function setPhone(
  properties: any,
  dataSourceId: string,
  propsCache: PropertiesCache,
  propName: string,
  value?: string
) {
  if (!value) return;
  await ensurePhoneProp(dataSourceId, propsCache, propName);
  properties[propName] = { phone_number: value };
}

type NotionTextType = "title" | "rich_text" | "phone_number";

async function setByType(
  properties: any,
  dataSourceId: string,
  propsCache: PropertiesCache,
  propName: string,
  notionType: NotionTextType,
  value?: string
) {
  switch (notionType) {
    case "rich_text":
      return setRichText(properties, dataSourceId, propsCache, propName, value);
    case "phone_number":
      return setPhone(properties, dataSourceId, propsCache, propName, value);
  }
}

async function mapFields<
  T extends Record<string, any>,
  M extends Record<string, string>
>(
  source: T | undefined,
  map: M,
  data: Data,
  properties: any,
  dataSourceId: string,
  propsCache: PropertiesCache,
  titleKey?: keyof M
) {
  if (!source) return;

  for (const key in map) {
    const sourceKey = key as keyof M & keyof T;
    const targetKey = map[sourceKey];
    const value = source?.[sourceKey];
    if (value) {
      data[targetKey as keyof Data] = value;
      if (titleKey && sourceKey === titleKey) {
        properties[targetKey] = { title: [{ text: { content: value } }] };
      } else {
        await setRichText(properties, dataSourceId, propsCache, targetKey, value);
      }
    }
  }
}

type SuffixSpec<Suf extends string> = {
  suffix: Suf;
  notionType: NotionTextType;
  format?: (raw: any) => string | undefined;
};

async function setIndexedFields<
  B extends string,
  T extends Record<string, any>,
  Suf extends string
>(
  items: T[] | undefined,
  base: B,
  fieldMap: Record<keyof T & string, SuffixSpec<Suf>>,
  data: Partial<Record<IndexedKeys<B, Suf>, string>>,
  properties: any,
  dataSourceId: string,
  propsCache: PropertiesCache
) {
  if (!Array.isArray(items) || items.length === 0) return;
  let i = 1;
  for (const item of items) {
    for (const k in fieldMap) {
      const spec = fieldMap[k];
      const raw = item?.[k];
      if (raw == null) continue;

      const key = `${base} ${i} - ${spec.suffix}` as const;
      const value = spec.format ? spec.format(raw) : String(raw);

      data[key] = value;
      await setByType(properties, dataSourceId, propsCache, key, spec.notionType, value);
    }
    i++;
  }
}

function formatPartialDate(d?: { year?: number; month?: number; day?: number }): string | undefined {
  if (!d) return;
  const parts: string[] = [];
  if (d.day != null) parts.push(String(d.day).padStart(2, "0"));
  if (d.month != null) parts.push(String(d.month).padStart(2, "0"));
  if (d.year != null) parts.push(String(d.year));
  return parts.length ? parts.join("/") : undefined;
}

type ContactEvent = {
  formattedType?: string;
  date?: { year?: number; month?: number; day?: number };
};

async function setIndexedEvents(
  events: ContactEvent[] | undefined,
  data: Data,
  properties: any,
  dataSourceId: string,
  propsCache: PropertiesCache
) {
  if (!Array.isArray(events) || events.length === 0) return;

  let i = 1;
  for (const ev of events) {
    const labelKey = `Event ${i} - Label` as const;
    const valueKey = `Event ${i} - Value` as const;

    if (ev.formattedType) {
      data[labelKey] = ev.formattedType;
      await setRichText(properties, dataSourceId, propsCache, labelKey, ev.formattedType);
    }

    const formatted = formatPartialDate(ev.date);
    if (formatted) {
      data[valueKey] = formatted;
      await setRichText(properties, dataSourceId, propsCache, valueKey, formatted);
    }

    i++;
  }
}

export function splitByLastSemicolon(text: string, maxLen = 2000) {
  const chunks = [];
  let i = 0;

  while (i < text.length) {
    const end = Math.min(i + maxLen, text.length);
    const slice = text.slice(i, end);

    if (slice.length < maxLen) {
      chunks.push(slice.trim());
      break;
    }

    const lastSemi = slice.lastIndexOf(';');

    if (lastSemi > -1) {
      const part = slice.slice(0, lastSemi + 1).trim();
      chunks.push(part);

      i += lastSemi + 1;
    } else {
      chunks.push(slice.trim());
      i += slice.length;
    }
  }

  return chunks.filter(p => p.length > 0);
}

export async function upsertContact(contactData: IContactRecord) {
  const properties: any = {}
  const data: Data = { "First Name": "" }
  const tags: string[] = []

  const dataSource = await notion.dataSources.retrieve({ data_source_id: env.dataSourceContact })

  const propsCache: PropertiesCache = { ...(dataSource.properties || {}) };

  if (Array.isArray(contactData.data?.names) && contactData.data.names.length > 0) {
    const contactNames: ContactName = contactData.data.names[0];
    const tagSet = new Set<string>(tags);

    for (const [srcKey, targetKey] of Object.entries(nameMap)) {
      const raw = contactNames[srcKey as keyof typeof nameMap];
      if (typeof raw !== "string" || !raw) continue;

      const found = extractTags(raw).map(tag => tag.toUpperCase().split(",").map(t => t.trim())).flat();
      for (const t of found) tagSet.add(t);

      const clean = raw.replace(/\[[^\]]*\]/g, "").trim();
      data[targetKey as keyof Data] = clean;

      if (srcKey === "givenName") {
        properties[targetKey] = { title: [{ text: { content: clean } }] };
      } else {
        await setRichText(properties, env.dataSourceContact, propsCache, targetKey, clean);
      }
    }
    tags.push(...tagSet)
  }

  const nick = contactData.data?.nicknames?.[0]?.value;
  if (nick) {
    data.Nickname = nick;
    await setRichText(properties, env.dataSourceContact, propsCache, "Nickname", nick);
  }

  if (Array.isArray(contactData.data?.organizations) && contactData.data.organizations.length > 0) {
    const contactOrganization: ContactOrganization = contactData.data.organizations[0];
    await mapFields(
      contactOrganization,
      organizationMap,
      data,
      properties,
      env.dataSourceContact,
      propsCache
    );
  }

  const dateObj = contactData.data?.birthdays?.[0]?.date;
  const birthday = formatPartialDate(dateObj);
  if (birthday) {
    data.Birthday = birthday;
    await setRichText(properties, env.dataSourceContact, propsCache, "Birthday", birthday);
  }

  const notes = contactData.data?.biographies?.[0]?.value;
  if (notes) {
    data.Notes = notes;
    await setRichText(properties, env.dataSourceContact, propsCache, "Notes", notes);
  }

  const photo = contactData.data?.photos?.[0]?.url;
  if (photo) {
    data.Photo = photo;
    await setRichText(properties, env.dataSourceContact, propsCache, "Photo", photo);
  }

  await setIndexedFields(
    contactData.data?.emailAddresses,
    "E - mail",
    { formattedType: { suffix: "Label", notionType: "rich_text" }, value: { suffix: "Value", notionType: "rich_text" } } as const,
    data,
    properties,
    env.dataSourceContact,
    propsCache
  );

  await setIndexedFields(
    contactData.data?.phoneNumbers,
    "Phone",
    {
      formattedType: { suffix: "Label", notionType: "rich_text" },
      value: { suffix: "Value", notionType: "phone_number" },
    } as const,
    data,
    properties,
    env.dataSourceContact,
    propsCache
  );

  await setIndexedFields(
    contactData.data?.addresses,
    "Address",
    {
      formattedType: { suffix: "Label", notionType: "rich_text" },
      formattedValue: { suffix: "Formatted", notionType: "rich_text" },
      streetAddress: { suffix: "Street", notionType: "rich_text" },
      city: { suffix: "City", notionType: "rich_text" },
      poBox: { suffix: "PO Box", notionType: "rich_text" },
      region: { suffix: "Region", notionType: "rich_text" },
      postalCode: { suffix: "Postal Code", notionType: "rich_text" },
      country: { suffix: "Country", notionType: "rich_text" },
      extendedAddress: { suffix: "Extended Address", notionType: "rich_text" },
    } as const,
    data,
    properties,
    env.dataSourceContact,
    propsCache
  );

  await setIndexedFields(
    contactData.data?.relations,
    "Relation",
    {
      formattedType: { suffix: "Label", notionType: "rich_text" },
      person: { suffix: "Value", notionType: "rich_text" },
    } as const,
    data,
    properties,
    env.dataSourceContact,
    propsCache
  );

  await setIndexedFields(
    contactData.data?.urls,
    "Website",
    {
      formattedType: { suffix: "Label", notionType: "rich_text" },
      value: { suffix: "Value", notionType: "rich_text" },
    } as const,
    data,
    properties,
    env.dataSourceContact,
    propsCache
  );

  await setIndexedEvents(
    contactData.data?.events,
    data,
    properties,
    env.dataSourceContact,
    propsCache
  );

  await setIndexedFields(
    contactData.data?.userDefined,
    "Custom Field",
    {
      key: { suffix: "Label", notionType: "rich_text" },
      value: { suffix: "Value", notionType: "rich_text" },
    } as const,
    data,
    properties,
    env.dataSourceContact,
    propsCache
  );

  if (tags.length > 0) {
    const relation = [];
    const database = await databaseContactPromise;

    for (const tag of tags) {
      let optionTagExist = await database.findFirst<{ notion_id: string }>({
        table: "tags",
        where: { tag },
        select: { notion_id: true },
      });

      if (!optionTagExist) {
        const resultNotionTag = await notion.pages.create({
          parent: { data_source_id: env.dataSourceTag },
          properties: {
            Tag: {
              title: [
                {
                  text: {
                    content: tag,
                  },
                },
              ],
            },
          },
        });
        optionTagExist = { notion_id: resultNotionTag.id };
        const newTag = await database.insertIntoTable<{ id: number }>({
          table: "tags",
          dataDict: { tag, notion_id: resultNotionTag.id },
          select: { id: true },
        });

        if (newTag) {
          const updateNotionTag = (await notion.pages.update({
            page_id: resultNotionTag.id,
            properties: { ID: { number: newTag.id } },
          })) as any;

          await database.updateIntoTable({
            table: "tags",
            dataDict: {
              updated_at: dayLib(updateNotionTag.last_edited_time).toDate(),
            },
            where: { id: newTag.id },
          });
        }
      }

      relation.push({ id: optionTagExist.notion_id });
    }

    properties["Tags"] = {
      relation,
    };
  }

  data["Concat - Variável"] = Object.entries(data)
    .map(([key, value]) => `'${key}': '${String(value).trim()}'`)
    .join(';  ');

  properties["Concat - Variável"] = {
    rich_text: splitByLastSemicolon(data["Concat - Variável"], 2000).map(part => ({ text: { content: part } })),
  }

  return {
    properties,
    dataDict: {
      ...data,
    },
  };
}
