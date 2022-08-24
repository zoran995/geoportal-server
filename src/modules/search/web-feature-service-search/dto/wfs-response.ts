export interface IWfs1_1_0Response {
  featureMember: Record<string, unknown>[];
  numberOfFeatures: number;
}

export interface IWfs2_0_0Response {
  member: Record<string, unknown>[];
  numberReturned: number;
  numberMatched: number;
}
