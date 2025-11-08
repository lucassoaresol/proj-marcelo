import { NotionRelationProp, NotionText, NotionTitleProp } from "./types"

type Properties = {
  ["Tag"]?: NotionTitleProp
  ["CONTATOS"]?: NotionRelationProp
}

function joinPlainText(chunks?: NotionText[]) {
  if (!chunks?.length) return undefined
  const contents = chunks
    .map(c => c?.text?.content?.trim())
    .filter(Boolean) as string[]
  return contents.length ? contents.join(" ") : undefined
}

export function mapNotionToTagRecord(properties: Properties) {
  const tag =
    joinPlainText(properties?.["Tag"]?.title) ??
    ""
  const contacts = properties?.["CONTATOS"]?.relation?.map(r => r.id) ?? []

  return { tag: tag.toUpperCase(), contacts }
}
