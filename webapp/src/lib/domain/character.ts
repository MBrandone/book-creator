export class Character {
  readonly id: string;
  readonly storyId: string;
  readonly name: string;
  readonly description: string;
  readonly photoStorageBucket: string | null;
  readonly photoStorageKey: string | null;

  private constructor(data: {
    id: string;
    storyId: string;
    name: string;
    description: string;
    photoStorageBucket?: string | null;
    photoStorageKey?: string | null;
  }) {
    this.id = data.id;
    this.storyId = data.storyId;
    this.name = data.name;
    this.description = data.description;
    this.photoStorageBucket = data.photoStorageBucket || null;
    this.photoStorageKey = data.photoStorageKey || null;
  }

  static create(data: {
    id: string;
    storyId: string;
    name: string;
    description: string;
    photoStorageBucket?: string | null;
    photoStorageKey?: string | null;
  }): Character {
    return new Character({
      id: data.id,
      storyId: data.storyId,
      name: data.name,
      description: data.description,
      photoStorageBucket: data.photoStorageBucket,
      photoStorageKey: data.photoStorageKey,
    });
  }
}
