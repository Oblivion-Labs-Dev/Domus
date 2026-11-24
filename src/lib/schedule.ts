export interface ScheduleBlock {
  id: string;
  title: string;
  ownerId: string;
  participantIds: string[];
  startTime: string;
  endTime: string;
  isShared: boolean;
  isRedacted?: boolean;
}

export interface AvailableSlot {
  startTime: string;
  endTime: string;
  label: string;
}

export interface ConflictDetail {
  eventId: string;
  title: string;
  startTime: string;
  endTime: string;
}

export function intervalsOverlap(
  aStartIso: string,
  aEndIso: string,
  bStartIso: string,
  bEndIso: string
): boolean {
  const aStart = new Date(aStartIso).getTime();
  const aEnd = new Date(aEndIso).getTime();
  const bStart = new Date(bStartIso).getTime();
  const bEnd = new Date(bEndIso).getTime();
  return aStart < bEnd && bStart < aEnd;
}

export function involvesMember(block: ScheduleBlock, memberId: string): boolean {
  return block.ownerId === memberId || block.participantIds.includes(memberId);
}

export function findConflictsForMember(
  blocks: ScheduleBlock[],
  memberId: string,
  startTime: string,
  endTime: string,
  excludeEventId?: string
): ConflictDetail[] {
  return blocks
    .filter((block) => {
      if (excludeEventId && block.id === excludeEventId) return false;
      if (!involvesMember(block, memberId)) return false;
      return intervalsOverlap(block.startTime, block.endTime, startTime, endTime);
    })
    .map((block) => ({
      eventId: block.id,
      title: block.isRedacted ? "Busy (Private Block)" : block.title,
      startTime: block.startTime,
      endTime: block.endTime,
    }));
}

/**
 * Finds open booking slots for a given family member on a YYYY-MM-DD date.
 */
export function findAvailableSlots(params: {
  blocks: ScheduleBlock[];
  targetMemberId: string;
  dateStr: string; // YYYY-MM-DD
  durationMinutes?: number;
  dayStartHour?: number;
  dayEndHour?: number;
}): AvailableSlot[] {
  const {
    blocks,
    targetMemberId,
    dateStr,
    durationMinutes = 60,
    dayStartHour = 7,
    dayEndHour = 21,
  } = params;

  const [year, month, day] = dateStr.split("-").map(Number);
  if (!year || !month || !day) return [];

  const slots: AvailableSlot[] = [];
  const stepMinutes = 60;

  for (
    let minuteOfDay = dayStartHour * 60;
    minuteOfDay + durationMinutes <= dayEndHour * 60;
    minuteOfDay += stepMinutes
  ) {
    const startH = Math.floor(minuteOfDay / 60);
    const startM = minuteOfDay % 60;
    const endTotal = minuteOfDay + durationMinutes;
    const endH = Math.floor(endTotal / 60);
    const endM = endTotal % 60;

    const startDate = new Date(year, month - 1, day, startH, startM, 0, 0);
    const endDate = new Date(year, month - 1, day, endH, endM, 0, 0);

    const startIso = startDate.toISOString();
    const endIso = endDate.toISOString();

    const conflicts = findConflictsForMember(
      blocks,
      targetMemberId,
      startIso,
      endIso
    );

    if (conflicts.length === 0) {
      const fmt = (h: number, m: number) => {
        const suffix = h >= 12 ? "PM" : "AM";
        const h12 = h % 12 === 0 ? 12 : h % 12;
        return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
      };
      slots.push({
        startTime: startIso,
        endTime: endIso,
        label: `${fmt(startH, startM)} – ${fmt(endH, endM)}`,
      });
    }
  }

  return slots;
}

/**
 * Classifies events into overlapping household moments vs. individual plans
 * and detects schedule collisions for any shared participant.
 */
export function annotateScheduleOverlaps<T extends ScheduleBlock>(
  events: T[]
): Array<T & { hasCollision: boolean; isFamilyOverlap: boolean }> {
  return events.map((event) => {
    const participants = Array.from(
      new Set([event.ownerId, ...event.participantIds])
    );
    const isFamilyOverlap = event.isShared || participants.length > 1;

    const hasCollision = events.some((other) => {
      if (other.id === event.id) return false;
      if (
        !intervalsOverlap(
          event.startTime,
          event.endTime,
          other.startTime,
          other.endTime
        )
      ) {
        return false;
      }
      const otherParticipants = new Set([
        other.ownerId,
        ...other.participantIds,
      ]);
      return participants.some((pid) => otherParticipants.has(pid));
    });

    return {
      ...event,
      hasCollision,
      isFamilyOverlap,
    };
  });
}
