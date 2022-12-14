import path from 'path';
import BaseModel from './BaseModel';
import { Model, QueryBuilder } from 'objection';
import User from './User';
import Skill from './Skill';
import File from './File';

class Project extends BaseModel {
  id?: string;
  title!: string;
  description!: string;
  type?: string | null;
  students_count?: string | null;
  duration?: string | null;
  status?: string | null;
  user_id!: string;
  created_at?: string;
  updated_at?: string;

  static tableName = 'projects';

  static relationsExpr = '[user.avatar, skills, files, participants]';

  static jsonSchema = {
    type: 'object',
    properties: {
      id: { type: 'uuid' },
      title: { type: 'string', minLength: 2, maxLength: 200 },
      description: { type: 'string', maxLength: 2000 },
      type: { type: 'string', enum: ['ongoing', 'onetime', 'none'], default: 'none' },
      students_count: { type: 'string', enum: ['one', 'many'], default: 'many' },
      duration: { type: 'string', enum: ['lessone', 'onethree', 'threesix', 'oversix'], default: 'lessone' },
      status: { type: 'string', enum: ['backlog', 'inprogress', 'done'], default: 'backlog' },
      created_at: { type: 'datetime' },
      updated_at: { type: 'datetime' },
    },
  };

  $beforeUpdate() {
    this.updated_at = new Date().toISOString();
  }

  static get modifiers() {
    return {
      orderByCreatedAt(builder: QueryBuilder<any>) {
        builder.orderBy('created_at', 'desc');
      },

      orderByCompletedAt(builder: QueryBuilder<any>) {
        builder.orderBy('completed_at', 'desc');
      },

      onlyCompleted(builder: QueryBuilder<any>) {
        builder.where('status', 'done');
      },

      onlyFromBacklog(builder: QueryBuilder<any>) {
        builder.where('status', 'backlog');
      },
    };
  }

  static relationMappings = {
    user: {
      relation: Model.BelongsToOneRelation,
      modelClass: path.join(__dirname, 'User'),
      join: {
        from: 'projects.user_id',
        to: 'users.id',
      },
    },
    skills: {
      relation: Model.ManyToManyRelation,
      modelClass: Skill,
      join: {
        from: 'projects.id',
        through: {
          from: 'projects_skills.project_id',
          to: 'projects_skills.skill_id',
        },
        to: 'skills.id',
      },
    },
    files: {
      relation: Model.HasManyRelation,
      modelClass: File,
      join: {
        from: 'projects.id',
        to: 'files.project_id',
      },
    },
    participants: {
      relation: Model.ManyToManyRelation,
      modelClass: path.join(__dirname, 'User'),
      join: {
        from: 'projects.id',
        through: {
          from: 'projects_users.project_id',
          to: 'projects_users.user_id',
          extra: ['is_accepted', 'review', 'completed_at'],
        },
        to: 'users.id',
      },
    },
  };
}

export default Project;
