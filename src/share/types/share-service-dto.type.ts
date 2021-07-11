import { ShareGistDto } from '../dto/share-gist.dto';
import { ShareS3Dto } from '../dto/share-s3.dto';

export type ShareServiceDtoType = ShareGistDto | ShareS3Dto;
