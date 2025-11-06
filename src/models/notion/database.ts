import notion from "../../libs/notion";

type SelectKind = "select" | "multi_select";

type UpsertOptionsParams = {
  dataSourceId: string;
  fieldName: string;
  propertyType: SelectKind;
  newOptions: string[];
  keepExisting?: boolean;
};

export async function upsertOptions({
  dataSourceId,
  fieldName,
  propertyType,
  newOptions,
  keepExisting = true,
}: UpsertOptionsParams) {
  const db = await notion.dataSources.retrieve({ data_source_id: dataSourceId }) as any;

  const field = db.properties?.[fieldName];
  if (!field || field.type !== propertyType) {
    throw new Error(
      `O campo "${fieldName}" não existe ou não é do tipo ${propertyType}.`
    );
  }

  const current =
    keepExisting
      ? ((field[propertyType].options as { name: string }[]) ?? [])
      : [];

  const mergedByName = new Map<string, { name: string }>();
  for (const op of [...current, ...newOptions.map(name => ({ name }))]) {
    mergedByName.set(op.name, op);
  }

  const options = Array.from(mergedByName.values());

  const properties =
    propertyType === "select"
      ? {
        [fieldName]: {
          select: { options },
        },
      }
      : {
        [fieldName]: {
          multi_select: { options },
        },
      };

  await notion.dataSources.update({
    data_source_id: dataSourceId,
    properties,
  });

  return options;
}

type OptionExistsParams = {
  dataSourceId: string;
  fieldName: string;
  propertyType: SelectKind;
  optionName: string;
};

export async function optionExistsUnified({
  dataSourceId,
  fieldName,
  propertyType,
  optionName,
}: OptionExistsParams): Promise<boolean> {
  const db = await notion.dataSources.retrieve({ data_source_id: dataSourceId }) as any;

  const field = db.properties?.[fieldName];
  if (!field || field.type !== propertyType) {
    throw new Error(
      `O campo "${fieldName}" não existe ou não é do tipo ${propertyType}.`
    );
  }

  const options = field[propertyType].options as { name: string }[];
  return options.some(op => op.name === optionName);
}

type FetchAllNotionQueryParams = { data_source_id: string, filter: any };

type NotionPageResult = { id: string, properties: any, last_edited_time: string }


export async function fetchAllNotionQuery(
  { data_source_id, filter }: FetchAllNotionQueryParams
): Promise<NotionPageResult[]> {
  const all: NotionPageResult[] = [];
  let next_cursor: string | null | undefined = undefined;

  do {
    const { results, next_cursor: next } = await notion.dataSources.query({
      data_source_id,
      filter, start_cursor: next_cursor ?? undefined
    });
    const data = results as any;
    all.push(...data);
    next_cursor = next;
  } while (next_cursor);

  return all;
}

