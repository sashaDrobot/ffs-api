import BaseModel from './BaseModel';
import { Model } from 'objection';
import Skill, { ISkill } from './Skill';
import Image, { IImage } from './Image';
import ImageService from '../services/ImageService';

export interface IUser {
  id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  position?: string;
  avatarUrl?: string;
  skills?: ISkill[];
}

class User extends BaseModel {
  id?: string;
  first_name!: string;
  last_name!: string;
  email!: string;
  phone?: string | null;
  position?: string | null;
  avatar?: IImage | null;
  password!: string;
  created_at?: string;
  updated_at?: string;

  static tableName = 'users';
  static hidden = ['avatar', 'password', 'created_at', 'updated_at'];

  static jsonSchema = {
    type: 'object',
    properties: {
      id: { type: 'uuid' },
      first_name: { type: 'string', minLength: 1, maxLength: 100 },
      last_name: { type: 'string', minLength: 1, maxLength: 100 },
      email: { type: 'string', minLength: 1, maxLength: 255 },
      phone: { type: ['string', 'null'], maxLength: 20 },
      position: { type: ['string', 'null'], maxLength: 100 },
      password: { type: 'string', minLength: 1, maxLength: 255 },
      created_at: { type: 'datetime' },
      updated_at: { type: 'datetime' },
    },
  };

  static get virtualAttributes() {
    return ['avatarUrl'];
  }

  get avatarUrl() {
    if (!this.avatar) return null;

    return ImageService.generateImageUrl(this.avatar.name, ImageService.AVATARS_DIRECTORY);
  }

  $beforeUpdate() {
    this.updated_at = new Date().toISOString();
  }

  static relationMappings = {
    avatar: {
      relation: Model.HasOneRelation,
      modelClass: Image,
      join: {
        from: 'users.id',
        to: 'images.entity_id',
      },
    },
    skills: {
      relation: Model.ManyToManyRelation,
      modelClass: Skill,
      join: {
        from: 'users.id',
        through: {
          from: 'users_skills.user_id',
          to: 'users_skills.skill_id',
        },
        to: 'skills.id',
      },
    },
  };
}

export default User;
