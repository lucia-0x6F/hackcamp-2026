import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { User } from '../domain/User.js';
import type { Profile } from '../types.js';
import type { UserRepository } from './UserRepository.js';
import type { SchoolRecord, SchoolRepository } from './SchoolRepository.js';
import type { ActivityFilters, ActivityRecord, ActivityRepository } from './ActivityRepository.js';
import type { JoinRequestRecord, JoinRequestRepository, JoinRequestStatus } from './JoinRequestRepository.js';

export const supabase = () => createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
const fail = (error: { message: string; code?: string } | null) => {
  if (error) {
    // Keep the Postgres/Supabase error code available to the HTTP error
    // handler. In particular, 23505 is a unique-constraint violation.
    const databaseError = new Error(`Database error: ${error.message}`) as Error & { code?: string };
    databaseError.code = error.code;
    throw databaseError;
  }
};
const user = (r: any) => User.create(r.id, { schoolId: r.school_id, name: r.name, pronoun: r.pronoun ?? null, schoolYear: r.school_year, major: r.major, hobbies: r.hobbies, interestedTypes: r.interested_types }, r.email);
const activity = (r: any): ActivityRecord => ({ id:r.id, creatorId:r.creator_id, schoolId:r.school_id, name:r.name, description:r.description, type:r.type, location:r.location, startTime:r.start_time, endTime:r.end_time, link:r.link });
const request = (r: any): JoinRequestRecord => ({ id:r.id, activityId:r.activity_id, userId:r.user_id, status:r.status, createdAt:r.created_at });

export class SupabaseUserRepository implements UserRepository {
  constructor(private db: SupabaseClient) {}
  async exists(id: string) { const { count, error } = await this.db.from('users').select('*', { count:'exact', head:true }).eq('id', id); fail(error); return Boolean(count); }
  async find(id: string) { const { data, error } = await this.db.from('users').select('*').eq('id', id).maybeSingle(); fail(error); return data ? user(data) : null; }
  async save(u: User) { const { error } = await this.db.from('users').upsert({ id:u.id, email:u.email, name:u.name, pronoun:u.pronoun, school_id:u.schoolId, school_year:u.schoolYear, major:u.major, hobbies:u.hobbies, interested_types:u.interestedTypes }); fail(error); }
}
export class SupabaseSchoolRepository implements SchoolRepository {
  constructor(private db: SupabaseClient) {}
  async mustFind(id: number): Promise<SchoolRecord> { const { data,error }=await this.db.from('schools').select('id,name,email_domain').eq('id',id).maybeSingle(); fail(error); if(!data) throw new Error('School not found'); return {id:data.id,name:data.name,emailDomain:data.email_domain}; }
  async list(): Promise<SchoolRecord[]> { const {data,error}=await this.db.from('schools').select('id,name,email_domain').order('name'); fail(error); return (data??[]).map(r=>({id:r.id,name:r.name,emailDomain:r.email_domain})); }
}
export class SupabaseActivityRepository implements ActivityRepository {
  constructor(private db: SupabaseClient) {}
  async create(a: ActivityRecord) { const {error}=await this.db.from('activities').insert({id:a.id,creator_id:a.creatorId,school_id:a.schoolId,name:a.name,description:a.description,type:a.type,location:a.location,start_time:a.startTime,end_time:a.endTime,link:a.link}); fail(error); return a; }
  async findById(id:string) { const {data,error}=await this.db.from('activities').select('*').eq('id',id).is('deleted_at',null).maybeSingle(); fail(error); return data?activity(data):null; }
  async list(f:ActivityFilters) { let q:any=this.db.from('activities').select('*').eq('school_id',f.schoolId).is('deleted_at',null).gt('end_time',new Date().toISOString()).order('start_time'); if(f.type)q=q.eq('type',f.type);if(f.location)q=q.ilike('location',`%${f.location}%`);if(f.startTime)q=q.gte('start_time',f.startTime);if(f.endTime)q=q.lt('start_time',f.endTime);const {data,error}=await q;fail(error);return(data??[]).map(activity); }
  async cleanupExpired() { const {error}=await this.db.from('activities').update({deleted_at:new Date().toISOString()}).is('deleted_at',null).lte('end_time',new Date().toISOString()); fail(error); }
  async update(id:string,a:Partial<Omit<ActivityRecord,'id'|'creatorId'>>) { const m:any={}; for(const[k,v]of Object.entries(a)) if(v!==undefined)m[k.replace(/[A-Z]/g,x=>`_${x.toLowerCase()}`)]=v; if(Object.keys(m).length){const{error}=await this.db.from('activities').update(m).eq('id',id).is('deleted_at',null);fail(error);}return this.findById(id); }
  async delete(id:string,creatorId:string) { const {data,error}=await this.db.from('activities').update({deleted_at:new Date().toISOString()}).eq('id',id).eq('creator_id',creatorId).is('deleted_at',null).select('id');fail(error);return Boolean(data?.length); }
}
export class SupabaseJoinRequestRepository implements JoinRequestRepository {
  constructor(private db: SupabaseClient) {}
  async create(r:JoinRequestRecord){const{error}=await this.db.from('join_requests').insert({id:r.id,activity_id:r.activityId,user_id:r.userId,status:r.status});fail(error);return r;}
  async find(id:string){const{data,error}=await this.db.from('join_requests').select('*').eq('id',id).maybeSingle();fail(error);return data?request(data):null;}
  async updateStatus(id:string,status:JoinRequestStatus){const{data,error}=await this.db.from('join_requests').update({status}).eq('id',id).select('*').maybeSingle();fail(error);return data?request(data):null;}
  async delete(id:string,userId:string){const{data,error}=await this.db.from('join_requests').delete().eq('id',id).eq('user_id',userId).eq('status','pending').select('id');fail(error);return Boolean(data?.length);}
  async listForActivity(activityId:string){const{data,error}=await this.db.from('join_requests').select('*').eq('activity_id',activityId).order('created_at');fail(error);return(data??[]).map(request);}
  async listForUser(userId:string){const{data,error}=await this.db.from('join_requests').select('*').eq('user_id',userId).order('created_at',{ascending:false});fail(error);return(data??[]).map(request);}
}
