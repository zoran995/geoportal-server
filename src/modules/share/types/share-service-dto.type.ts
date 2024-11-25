import { ShareGistType } from '../config/schema/share-gist.schema';
import { ShareS3Type } from '../config/schema/share-s3.schema';

export type ShareServiceType = ShareGistType | ShareS3Type;
