import type { EmailService } from './EmailService.js';
import type { ActivityRecord } from '../repositories/ActivityRepository.js';
import type { JoinRequestRecord } from '../repositories/JoinRequestRepository.js';
import type { User } from '../domain/User.js';

type JoinRequestDecision = 'accepted' | 'rejected';

export class NotificationService {
  constructor(private readonly email: EmailService) {}

  async notify(to: string, subject: string, text: string): Promise<void> {
    await this.email.send({ to, subject, text });
  }

  async notifyWelcome(userEmail: string, name: string): Promise<void> {
    await this.notify(
      userEmail,
      'Welcome to OnCampus',
      [`Hi ${name},`, '', 'Welcome to OnCampus! Your account is ready.', '', 'Find classmates, create activities, and join campus events.'].join('\n'),
    );
  }

  async notifyActivityCreatorOfJoinRequest(
    creatorEmail: string,
    activity: ActivityRecord,
    request: JoinRequestRecord,
    applicant: User,
  ): Promise<void> {
    const subject = `New join request for ${activity.name}`;

    const body = [
      `A student has requested to join your activity: ${activity.name}.`,
      '',
      'Applicant profile:',
      `Name:          ${applicant.name}`,
      `Email:         ${applicant.email}`,
      `School ID:     ${applicant.schoolId}`,
      `Year:          ${applicant.schoolYear}`,
      `Major:         ${applicant.major ?? 'Not specified'}`,
      `Hobbies:       ${applicant.hobbies.length ? applicant.hobbies.join(', ') : 'Not specified'}`,
      `Interested in: ${applicant.interestedTypes.length ? applicant.interestedTypes.join(', ') : 'Not specified'}`,
      `Location:   ${activity.location}`,
      `Starts:     ${activity.startTime}`,
      `Ends:       ${activity.endTime}`,
      `Request ID: ${request.id}`,
      '',
      'Open OnCampus to review this request.',
    ].join('\n');

    await this.notify(creatorEmail, subject, body);
  }

  async notifyApplicantOfDecision(
    applicantEmail: string,
    activity: ActivityRecord,
    decision: JoinRequestDecision,
  ): Promise<void> {
    const isAccepted = decision === 'accepted';

    const subject = `Your request was ${decision}`;

    const nextStep = isAccepted
      ? 'You can now attend this activity.'
      : 'You can browse OnCampus for other activities.';

    const body = [
      `Your request to join "${activity.name}" was ${decision}.`,
      '',
      `Location: ${activity.location}`,
      `Starts:   ${activity.startTime}`,
      `Ends:     ${activity.endTime}`,
      '',
      nextStep,
    ].join('\n');

    await this.notify(applicantEmail, subject, body);
  }
}
