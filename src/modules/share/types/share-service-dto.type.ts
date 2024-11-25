import { ShareGistType } from '../dto/share-gist.dto';
import { ShareS3Type } from '../dto/share-s3.dto';

export type ShareServiceType = ShareGistType | ShareS3Type;
