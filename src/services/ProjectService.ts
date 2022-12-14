import { v4 as uuid } from 'uuid';
import Project from '../models/Project';
import SkillService from './SkillService';
import File, { IFile } from '../models/File';
import Skill from '../models/Skill';
import User from '../models/User';
import ProjectUser from '../models/ProjectUser';

export interface ICreateProject {
  title: string;
  description: string;
  type: string;
  students_count: string;
  duration: string;
  userId: string;
  skills: string[];
  files: IFile[];
}

export interface IEditProject {
  title?: string;
  description?: string;
  type?: string;
  students_count?: string;
  duration?: string;
  skills?: string[];
  removedFiles?: string[];
  files?: IFile[];
}

class ProjectService {
  public static async create(projectData: ICreateProject) {
    const {
      title,
      description,
      type,
      students_count,
      duration,
      userId,
      skills = [],
      files = [],
    } = projectData;

    const projectId = uuid();
    const project = await Project.query().insertAndFetch({
      id: projectId,
      title: title,
      description: description,
      type: type,
      students_count: students_count,
      duration: duration,
      user_id: userId,
    });
    await SkillService.addSkillsToEntity(project, skills);

    if (files.length) {
      await project.$relatedQuery<File>('files')
        .insert(files.map(file => ({
          ...file,
          id: uuid(),
        })));
    }

    return this.findById(projectId);
  }

  public static async findById(id: string = ''): Promise<Project> {
    return Project.query().findById(id).withGraphFetched(Project.relationsExpr);
  }

  public static async findAllByUserId(userId: string = '') {
    return Project.query().where('user_id', userId).orderBy('created_at', 'desc')
      .withGraphFetched(Project.relationsExpr);
  }

  public static async findAll() {
    return Project.query().orderBy('created_at', 'desc').withGraphFetched(Project.relationsExpr);
  }

  public static async update(id: string, projectData: IEditProject) {
    const {
      title,
      description,
      type,
      students_count,
      duration,
      skills = [],
      removedFiles = [],
      files = [],
    } = projectData;

    const project = await Project.query().patchAndFetchById(id, {
      title: title,
      description: description,
      type: type,
      students_count: students_count,
      duration: duration,
    });
    await SkillService.addSkillsToEntity(project, skills);

    if (removedFiles.length) {
      await project.$relatedQuery<File>('files')
        .whereIn('id', removedFiles)
        .delete();
    }

    if (files.length) {
      await project.$relatedQuery<File>('files')
        .insert(files.map(file => ({
          ...file,
          id: uuid(),
        })));
    }

    return this.findById(id);
  }

  public static async remove(id: string) {
    const project = await this.findById(id);
    await project.$relatedQuery<File>('files').delete();
    await project.$relatedQuery<Skill>('skills').unrelate();

    return project.$query().delete();
  }

  public static async request(id: string, user: User) {
    const project = await this.findById(id);
    await project.$relatedQuery<User>('participants').relate(user);
  }

  public static async cancelRequest(id: string, user: User) {
    const project = await this.findById(id);
    // @ts-ignore
    await project.$relatedQuery<User>('participants').where('id', user.id).unrelate();
  }

  public static async acceptUser(id: string, userId: string) {
    await ProjectUser.query().where({
      user_id: userId,
      project_id: id,
    }).patch({ is_accepted: true });
  }

  public static async removeRequest(id: string, userId: string) {
    await ProjectUser.query().where({
      user_id: userId,
      project_id: id,
    }).delete();
  }

  public static async complete(id: string, reviews: any) {
    await Project.query().findById(id).patch({ status: 'done' });
    // @ts-ignore
    await reviews.map(async ({ userId, review }) => {
      await ProjectUser.query().where({
        project_id: id,
        user_id: userId,
      }).patch({
        is_accepted: true,
        review: review,
        completed_at: new Date().toISOString(),
      });
    });
  }
}

export default ProjectService;
