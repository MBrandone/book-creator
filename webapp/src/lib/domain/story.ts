import { Character } from './character';

export type StoryStatus = 'pending' | 'generating' | 'completed' | 'failed';

export class Story {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  status: StoryStatus;
  readonly createdAt: Date;
  updatedAt: Date;
  readonly characters: Character[];

  private constructor(data: {
    id: string;
    title: string;
    description: string;
    status: StoryStatus;
    createdAt: Date;
    updatedAt: Date;
    characters: Character[];
  }) {
    this.id = data.id;
    this.title = data.title;
    this.description = data.description;
    this.status = data.status;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.characters = data.characters;
  }

  static create(data: {
    id: string;
    title: string;
    description: string;
  }): Story {
    return new Story({
      id: data.id,
      title: data.title,
      description: data.description,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      characters: [],
    });
  }

  static hydrate(data: {
    id: string;
    title: string;
    description: string;
    status: StoryStatus;
    createdAt: Date;
    updatedAt: Date;
    characters: Character[];
  }): Story {
    return new Story(data);
  }

  getCharacterCount(): number {
    return this.characters.length;
  }

  canAddMoreCharacters(): boolean {
    return this.getCharacterCount() < 2;
  }

  startGeneration(): void {
    this.status = 'generating';
    this.updatedAt = new Date();
  }

  markAsCompleted(): void {
    this.status = 'completed';
    this.updatedAt = new Date();
  }

  markAsFailed(): void {
    this.status = 'failed';
    this.updatedAt = new Date();
  }
}
