import { Storage } from '@/lib/infrastructure/storage/storage';
import { InvalidContentTypeError } from './invalid-content-type-error';
import { randomUUID } from 'crypto';

export class GetPhotoUploadUrlCommandHandler {
  constructor(
    private readonly storage: Storage
  ) {}

  async execute(command: GetPhotoUploadUrlCommand): Promise<GetPhotoUploadUrlResult> {
    if (!ALLOWED_CONTENT_TYPES.includes(command.contentType)) {
      throw new InvalidContentTypeError(command.contentType);
    }

    const extension = this.getFileExtension(command.contentType);
    const uuid = randomUUID();
    const storageKey = `character-photos/${uuid}.${extension}`;
    const bucket = process.env.STORAGE_BUCKET || 'book-images';

    const uploadUrl = await this.storage.getPresignedUploadUrl(
      storageKey,
      command.contentType,
      UPLOAD_URL_EXPIRY_SECONDS
    );

    return {
      uploadUrl,
      storageKey,
      storageBucket: bucket,
      expiresIn: UPLOAD_URL_EXPIRY_SECONDS,
    };
  }

  private getFileExtension(contentType: string): string {
    const map: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
    };
    
    const extension = map[contentType];
    if (!extension) {
      throw new InvalidContentTypeError(contentType);
    }
    
    return extension;
  }
}

export interface GetPhotoUploadUrlCommand {
  contentType: string;
}

export interface GetPhotoUploadUrlResult {
  uploadUrl: string;
  storageKey: string;
  storageBucket: string;
  expiresIn: number;
}

const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

const UPLOAD_URL_EXPIRY_SECONDS = 300;
