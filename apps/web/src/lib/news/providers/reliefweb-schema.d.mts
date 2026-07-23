export type ReliefWebReference = { id?: number | string; name?: string; shortname?: string };
export type ReliefWebReportFields = {
  title?: string;
  url?: string;
  url_alias?: string;
  body?: string;
  date?: { original?: string; created?: string; changed?: string };
  source?: ReliefWebReference[];
  country?: ReliefWebReference[];
  disaster?: ReliefWebReference[];
  disaster_type?: ReliefWebReference[];
  format?: ReliefWebReference[];
  language?: ReliefWebReference[];
  headline?: boolean;
};
export type ReliefWebResponse = {
  data: Array<{ id: number | string; href?: string; fields: ReliefWebReportFields }>;
};
export function isReliefWebResponse(value: unknown): value is ReliefWebResponse;
