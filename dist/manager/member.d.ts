import { BaseManager } from '@repandrip/core';
import { Member, MemberProfile } from '../resource/member';
export declare class MemberManager extends BaseManager {
    private readonly _cachedMembers;
    private readonly _cachedMemberProfiles;
    get(ID: number): Promise<Member | undefined>;
    getProfile(ID: number): Promise<MemberProfile | undefined>;
}
