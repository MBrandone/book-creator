export class Character {
  readonly id: string;
  readonly storyId: string;
  readonly name: string;
  readonly description: string;

  private constructor(data: {
    id: string;
    storyId: string;
    name: string;
    description: string;
  }) {
    this.id = data.id;
    this.storyId = data.storyId;
    this.name = data.name;
    this.description = data.description;
  }

  static create(data: {
    id: string;
    storyId: string;
    name: string;
    description: string;
  }): Character {
    return new Character({
      id: data.id,
      storyId: data.storyId,
      name: data.name,
      description: data.description,
    });
  }
}
