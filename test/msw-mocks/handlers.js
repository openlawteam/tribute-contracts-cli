import { rest } from "msw";

import {
  snapshotAPIDraftResponse,
  snapshotAPIOffchainProofResponse,
  snapshotAPIProposalResponse,
  snapshotAPIRootResponse,
  snapshotAPISpaceResponse,
  snapshotAPISubmitMessage,
} from "./rest-responses/snapshot-api";
import { DEFAULT_SNAPSHOT_HUB_API_URL } from "./helpers";

/**
 * Snapshot API
 */

const getSnapshotAPIStatus = rest.get(
  `${DEFAULT_SNAPSHOT_HUB_API_URL}/api`,
  (_req, res, ctx) =>
    res(
      ctx.json({
        data: {
          name: "snapshot-hub",
          network: "testnet",
          version: "0.1.2",
          tag: "alpha",
          relayer: "0xEd7B3f2902f2E1B17B027bD0c125B674d293bDA0",
        },
      })
    )
);

const getSnapshotAPIRoot = rest.get(
  `${DEFAULT_SNAPSHOT_HUB_API_URL}/api`,
  async (_req, res, ctx) => res(ctx.json(snapshotAPIRootResponse))
);

const getSnapshotAPISpace = rest.get(
  `${DEFAULT_SNAPSHOT_HUB_API_URL}/api/spaces/:spaceName`,
  async (_req, res, ctx) => res(ctx.json(snapshotAPISpaceResponse))
);

const getSnapshotAPIDraft = rest.get(
  `${DEFAULT_SNAPSHOT_HUB_API_URL}/api/:spaceName/draft/:id`,
  async (_req, res, ctx) => res(ctx.json(snapshotAPIDraftResponse))
);

const getSnapshotAPIProposal = rest.get(
  `${DEFAULT_SNAPSHOT_HUB_API_URL}/api/:spaceName/proposal/:id`,
  async (_req, res, ctx) => res(ctx.json(snapshotAPIProposalResponse))
);

const postSnapshotAPIMessage = rest.post(
  `${DEFAULT_SNAPSHOT_HUB_API_URL}/api/message`,
  async (_req, res, ctx) => res(ctx.json(snapshotAPISubmitMessage))
);

const postSnapshotAPIOffchainProof = rest.post(
  `${DEFAULT_SNAPSHOT_HUB_API_URL}/api/:spaceName/offchain_proofs`,
  (_req, res, ctx) => res(ctx.status(201))
);

const getSnapshotAPIOffchainProof = rest.get(
  `${DEFAULT_SNAPSHOT_HUB_API_URL}/api/:spaceName/offchain_proof/:merkleRoot`,
  (_req, res, ctx) => res(ctx.json(snapshotAPIOffchainProofResponse))
);

/**
 * HANDLERS TO EXPORT
 */

const handlers = [
  getSnapshotAPIDraft,
  getSnapshotAPIOffchainProof,
  getSnapshotAPIProposal,
  getSnapshotAPIRoot,
  getSnapshotAPIStatus,
  getSnapshotAPISpace,
  postSnapshotAPIMessage,
  postSnapshotAPIOffchainProof,
];

export { handlers };
