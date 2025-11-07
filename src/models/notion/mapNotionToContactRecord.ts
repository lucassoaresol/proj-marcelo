import databaseContactPromise from "../../db/contact";
import { NotionProps, NotionText } from "./types";

function joinPlainText(chunks?: NotionText[]) {
  if (!chunks?.length) return undefined
  const contents = chunks
    .map(c => c?.text?.content?.trim())
    .filter(Boolean) as string[]
  return contents.length ? contents.join(" ") : undefined
}

function extractText(
  prop: any,
  type: "title" | "rich_text" | "phone_number"
) {
  switch (type) {
    case "title":
      return joinPlainText(prop?.title);
    case "rich_text":
      return joinPlainText(prop?.rich_text);
    case "phone_number":
      return typeof prop?.phone_number === "string"
        ? prop.phone_number.trim()
        : undefined;
    default:
      return undefined;
  }
}

function getText(
  props: Record<string, any>,
  key: string,
  type: "title" | "rich_text" | "phone_number"
): string | undefined {
  const prop = props?.[key];
  if (!prop) return;

  if (prop.is_updated) {
    return extractText(prop, type) ?? "";
  }

  return extractText(prop, type);
}

function parsePartialDate(str?: string): { day?: number; month?: number; year?: number } | undefined {
  if (!str) return;
  const parts = str.split("/").map(s => s.trim()).filter(Boolean);
  if (!parts.length) return;
  const d: { day?: number; month?: number; year?: number } = {};
  if (parts[0]) d.day = Number(parts[0]);
  if (parts[1]) d.month = Number(parts[1]);
  if (parts[2]) d.year = Number(parts[2]);
  return Object.keys(d).length ? d : undefined;
}

function collectIndexed<T extends Record<string, any>>(
  data: any,
  props: NotionProps,
  base: string,
  suffixMap: Record<string, {
    outKey: keyof T;
    notionType: "title" | "rich_text" | "phone_number"; parse?: (raw?: string) => any
  }>
): T[] {
  const re = new RegExp(`^${base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+(\\d+)\\s+-\\s+(${Object.keys(suffixMap).map(s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})$`);
  const out: Record<number, T> = {};

  for (const key of Object.keys(props)) {
    const m = key.match(re);
    if (!m) continue;
    const idx = Number(m[1]) - 1;
    const suffix = m[2];
    const spec = suffixMap[suffix];
    if (!spec) continue;

    const val = getText(props, key, spec.notionType);
    if (val == null) continue;

    if (!out[idx]) out[idx] = {} as T;
    out[idx][spec.outKey] = spec.parse ? spec.parse(val) : val;
    data[`${base} ${m[1]} - ${suffix}`] = val
  }

  return Object.values(out).filter(o => Object.keys(o).length > 0);
}

export async function mapNotionToContactRecord(properties: any) {
  const database = await databaseContactPromise

  const requestBody: any = {}
  const dataDict: any = {}

  const dataName: any = {};
  dataName.givenName = getText(properties, "First Name", "title") ?? "";
  dataDict["First Name"] = dataName.givenName;
  const middle = getText(properties, "Middle Name", "rich_text"); if (middle) { dataName.middleName = middle; dataDict["Middle Name"] = middle; }
  const last = getText(properties, "Last Name", "rich_text"); if (last) { dataName.familyName = last; dataDict["Last Name"] = last; }
  const pGiven = getText(properties, "Phonetic First Name", "rich_text"); if (pGiven) { dataName.phoneticGivenName = pGiven; dataDict["Phonetic First Name"] = pGiven; }
  const pMid = getText(properties, "Phonetic Middle Name", "rich_text"); if (pMid) { dataName.phoneticMiddleName = pMid; dataDict["Phonetic Middle Name"] = pMid; }
  const pLast = getText(properties, "Phonetic Last Name", "rich_text"); if (pLast) { dataName.phoneticFamilyName = pLast; dataDict["Phonetic Last Name"] = pLast; }
  const prefix = getText(properties, "Name Prefix", "rich_text"); if (prefix) { dataName.honorificPrefix = prefix; dataDict["Name Prefix"] = prefix; }
  const suffix = getText(properties, "Name Suffix", "rich_text"); if (suffix) { dataName.honorificSuffix = suffix; dataDict["Name Suffix"] = suffix; }

  const tagRels = properties?.["Tags"]?.relation ?? [];
  if (Array.isArray(tagRels) && tagRels.length) {
    const tagResults = await Promise.all(
      tagRels.map((rel: { id: string }) =>
        database.findFirst({ table: "tags", where: { notion_id: rel.id }, select: { tag: true } })
      )
    );
    const baseTags = tagResults.map(r => (r as any)?.tag?.trim()).filter(Boolean) as string[];
    const tags = baseTags.length ? baseTags.join(",") : undefined;
    if (tags) {
      if (dataName.familyName) dataName.familyName += `[${tags}]`;
      else dataName.familyName = `[${tags}]`;
    }
  }

  requestBody.names = [dataName]

  const nickname = getText(properties, "Nickname", "rich_text");
  if (nickname) { requestBody.nicknames = [{ value: nickname }]; dataDict["Nickname"] = nickname; }

  const org: any = {};
  const orgName = getText(properties, "Organization Name", "rich_text"); if (orgName) { org.name = orgName; dataDict["Organization Name"] = orgName; }
  const orgTitle = getText(properties, "Organization Title", "rich_text"); if (orgTitle) { org.title = orgTitle; dataDict["Organization Title"] = orgTitle; }
  const orgDept = getText(properties, "Organization Department", "rich_text"); if (orgDept) { org.department = orgDept; dataDict["Organization Department"] = orgDept; }
  if (Object.keys(org).length) requestBody.organizations = [org];

  const birthdayStr = getText(properties, "Birthday", "rich_text");
  const birthdayDate = parsePartialDate(birthdayStr);
  if (birthdayDate) { requestBody.birthdays = [{ date: birthdayDate }]; dataDict["Birthday"] = birthdayStr; }

  const notes = getText(properties, "Notes", "rich_text");
  if (notes) { requestBody.biographies = [{ value: notes }]; dataDict["Notes"] = notes; }

  const emails = collectIndexed<{ formattedType?: string; value?: string }>(dataDict,
    properties,
    "E - mail",
    {
      "Label": { outKey: "formattedType", notionType: "rich_text" },
      "Value": { outKey: "value", notionType: "rich_text" },
    }
  );
  if (emails.length) requestBody.emailAddresses = emails;

  const phones = collectIndexed<{ formattedType?: string; value?: string }>(dataDict,
    properties,
    "Phone",
    {
      "Label": { outKey: "formattedType", notionType: "rich_text" },
      "Value": { outKey: "value", notionType: "phone_number" },
    }
  );
  if (phones.length) requestBody.phoneNumbers = phones;

  const addresses = collectIndexed<{
    formattedType?: string; formattedValue?: string;
    streetAddress?: string; city?: string; poBox?: string;
    region?: string; postalCode?: string; country?: string; extendedAddress?: string;
  }>(dataDict,
    properties,
    "Address",
    {
      "Label": { outKey: "formattedType", notionType: "rich_text" },
      "Formatted": { outKey: "formattedValue", notionType: "rich_text" },
      "Street": { outKey: "streetAddress", notionType: "rich_text" },
      "City": { outKey: "city", notionType: "rich_text" },
      "PO Box": { outKey: "poBox", notionType: "rich_text" },
      "Region": { outKey: "region", notionType: "rich_text" },
      "Postal Code": { outKey: "postalCode", notionType: "rich_text" },
      "Country": { outKey: "country", notionType: "rich_text" },
      "Extended Address": { outKey: "extendedAddress", notionType: "rich_text" },
    }
  );
  if (addresses.length) requestBody.addresses = addresses;

  const relations = collectIndexed<{ formattedType?: string; person?: string }>(dataDict,
    properties,
    "Relation",
    {
      "Label": { outKey: "formattedType", notionType: "rich_text" },
      "Value": { outKey: "person", notionType: "rich_text" },
    }
  );
  if (relations.length) requestBody.relations = relations;

  const urls = collectIndexed<{ formattedType?: string; value?: string }>(dataDict,
    properties,
    "Website",
    {
      "Label": { outKey: "formattedType", notionType: "rich_text" },
      "Value": { outKey: "value", notionType: "rich_text" },
    }
  );
  if (urls.length) requestBody.urls = urls;

  const events = collectIndexed<{ formattedType?: string; date?: { year?: number; month?: number; day?: number } }>(dataDict,
    properties,
    "Event",
    {
      "Label": { outKey: "formattedType", notionType: "rich_text" },
      "Value": { outKey: "date", notionType: "rich_text", parse: (raw) => parsePartialDate(raw) },
    }
  );
  if (events.length) requestBody.events = events;

  const userDefined = collectIndexed<{ key?: string; value?: string }>(dataDict,
    properties,
    "Custom Field",
    {
      "Label": { outKey: "key", notionType: "rich_text" },
      "Value": { outKey: "value", notionType: "rich_text" },
    }
  );
  if (userDefined.length) requestBody.userDefined = userDefined;

  const photoStr = getText(properties, "Photo", "rich_text");
  if (photoStr) { dataDict["Photo"] = photoStr; }

  dataDict["Concat - Variável"] = Object.entries(dataDict)
    .map(([key, value]) => `'${key}': '${String(value).trim()}'`)
    .join(';  ');

  return {
    requestBody,
    dataDict,
  };
}
