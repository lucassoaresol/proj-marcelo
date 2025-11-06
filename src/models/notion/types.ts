export type NotionText = { type: string; text?: { content: string } } & Record<string, any>
export type NotionTitleProp = { title?: NotionText[] }
export type NotionRichTextProp = { rich_text?: NotionText[] }
export type NotionRelationProp = { relation?: { id: string }[] }
export type NotionSelectProp = { select?: { name: string } }
export type NotionRich = { rich_text?: { text?: { content?: string } }[]; title?: { text?: { content?: string } }[] };
export type NotionProps = Record<string, NotionRich | any>;
