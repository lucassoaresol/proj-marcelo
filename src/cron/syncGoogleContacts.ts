import { google, people_v1 } from "googleapis";

import databaseContactPromise from "../db/contact";
import dayLib from "../libs/dayjs";
import { authenticate } from "../libs/people";
import { IContactRecord } from "../models/google/types";
import {
  createGoogleContactQueue,
  excludeGoogleContactQueue,
  updateGoogleContactQueue,
} from "../worker/services/google";

interface IContactsPageResult {
  contacts: IContactRecord[];
  nextPageToken?: string | null;
}

async function fetchGoogleContactsPage(
  userEmail: string,
  nextPageToken?: string,
): Promise<IContactsPageResult> {
  const authData = await authenticate(userEmail);
  const auth = authData as unknown as string;

  const people = google.people({ version: "v1", auth });

  const res = await people.people.connections.list({
    resourceName: "people/me",
    personFields:
      "names,nicknames,organizations,birthdays,biographies,photos,emailAddresses,phoneNumbers,addresses,relations,urls,events,userDefined,metadata",
    pageToken: nextPageToken,
  });

  const raw = res.data.connections ?? [];
  const contacts = raw.map((ct) => mapGooglePersonToContactRecord(ct));

  return { contacts, nextPageToken: res.data.nextPageToken };
}

function mapGooglePersonToContactRecord(
  person: people_v1.Schema$Person,
): IContactRecord {
  const contactSource = person.metadata?.sources?.find(
    (s) => s.type === "CONTACT",
  );
  const updateTimeIso = contactSource?.updateTime;

  const record: IContactRecord = {
    resource_name: person.resourceName ?? null,
    updated_at: updateTimeIso
      ? dayLib(updateTimeIso).toDate()
      : dayLib().toDate(),
  };

  record.data = {
    names: person.names,
    nicknames: person.nicknames,
    organizations: person.organizations,
    birthdays: person.birthdays,
    biographies: person.biographies,
    photos: person.photos,
    emailAddresses: person.emailAddresses,
    phoneNumbers: person.phoneNumbers,
    addresses: person.addresses,
    relations: person.relations,
    urls: person.urls,
    events: person.events,
    userDefined: person.userDefined,
  };

  return record;
}

async function fetchAllUserGoogleContacts(
  userEmail: string,
): Promise<IContactRecord[]> {
  const all: IContactRecord[] = [];
  let nextPageToken: string | null | undefined = undefined;

  do {
    const { contacts, nextPageToken: next } = await fetchGoogleContactsPage(
      userEmail,
      nextPageToken ?? undefined,
    );
    all.push(...contacts);
    nextPageToken = next;
  } while (nextPageToken);

  return all;
}

function difference(a: Iterable<string>, b: Iterable<string>): string[] {
  const setB = new Set(b);
  const result: string[] = [];
  for (const x of a) if (!setB.has(x)) result.push(x);
  return result;
}

function intersection(a: Iterable<string>, b: Iterable<string>): string[] {
  const setB = new Set(b);
  const result: string[] = [];
  for (const x of a) if (setB.has(x)) result.push(x);
  return result;
}

export async function syncGoogleContacts() {
  const db = await databaseContactPromise;

  const dbContacts = await db.findMany<{ resource_name: string }>({
    table: "contacts",
    select: { resource_name: true },
  });
  const existingResourceNames = new Set<string>(
    dbContacts.flatMap((c: { resource_name: string }) =>
      c.resource_name ? [c.resource_name] : [],
    ),
  );

  const allContacts = await fetchAllUserGoogleContacts("marcelo@mfiuza.com.br");

  const googleContactsByResource = new Map<string, IContactRecord>();
  for (const c of allContacts) {
    const rn = c.resource_name;
    if (!rn) continue;
    googleContactsByResource.set(rn, c);
  }
  const incomingResourceNames = new Set(googleContactsByResource.keys());

  const toInsertResourceNames = difference(
    incomingResourceNames,
    existingResourceNames,
  );

  const toInsertContacts = Array.from(toInsertResourceNames)
    .map((rn) => googleContactsByResource.get(rn))
    .filter((c): c is IContactRecord => Boolean(c));

  for (const toInsert of toInsertContacts) {
    await createGoogleContactQueue.add("save-create-google-contact", toInsert, {
      attempts: 1000,
      backoff: { type: "exponential", delay: 5000 },
    });
  }

  const missingInIncoming = difference(
    existingResourceNames,
    incomingResourceNames,
  );

  for (const missing of missingInIncoming) {
    await excludeGoogleContactQueue.add(
      "save-exclude-google-contact",
      missing,
      { attempts: 1000, backoff: { type: "exponential", delay: 5000 } },
    );
  }

  const alreadyExistingResourceNames = intersection(
    existingResourceNames,
    incomingResourceNames,
  );

  const alreadyExistingContacts = Array.from(alreadyExistingResourceNames)
    .map((rn) => googleContactsByResource.get(rn))
    .filter((c): c is IContactRecord => Boolean(c));

  for (const alreadyExisting of alreadyExistingContacts) {
    await updateGoogleContactQueue.add(
      "save-update-google-contact",
      alreadyExisting,
      { attempts: 1000, backoff: { type: "exponential", delay: 5000 } },
    );
  }
}
