export interface TimelineEvent {

  id: string;

  title: string;

  description: string;

  timestamp: Date;

  type:
    | "trust"
    | "risk"
    | "opportunity"
    | "governance"
    | "system";

}

export class TimelineEngine {

  private events: TimelineEvent[] = [];

  addEvent(

    title: string,

    description: string,

    type: TimelineEvent["type"]

  ) {

    this.events.unshift({

      id: crypto.randomUUID(),

      title,

      description,

      timestamp: new Date(),

      type,

    });

  }

  getEvents() {

    return this.events;

  }

}

export const executiveTimeline =
  new TimelineEngine();
