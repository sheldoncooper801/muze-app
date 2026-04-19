import { useQuery } from "@tanstack/react-query";
import { MapPin, Calendar, Clock, Ticket, ExternalLink } from "lucide-react";

interface Event {
  id: number;
  title: string;
  venue: string;
  city: string;
  date: string;
  time: string;
  ticketUrl: string;
  price: number;
  description: string;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" });
}

function getDaysAway(dateStr: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const event = new Date(dateStr + "T12:00:00");
  const diff = Math.round((event.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return "Past event";
  if (diff === 0) return "Today!";
  if (diff === 1) return "Tomorrow!";
  if (diff < 7) return `${diff} days away`;
  if (diff < 30) return `${Math.round(diff / 7)} weeks away`;
  return `${Math.round(diff / 30)} months away`;
}

export default function EventsPage() {
  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const upcomingEvents = events.filter(e => new Date(e.date + "T12:00:00") >= new Date());
  const pastEvents = events.filter(e => new Date(e.date + "T12:00:00") < new Date());

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
          <Ticket className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>MUZE Live</h1>
          <p className="text-sm text-muted-foreground">Upcoming shows and events</p>
        </div>
      </div>

      {/* Upcoming */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-36 rounded-2xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {upcomingEvents.length > 0 && (
            <div className="mb-8">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Upcoming</h2>
              <div className="space-y-4">
                {upcomingEvents.map(event => {
                  const daysAway = getDaysAway(event.date);
                  const isNear = daysAway.includes("days") || daysAway.includes("Today") || daysAway.includes("Tomorrow");
                  return (
                    <div
                      key={event.id}
                      data-testid={`event-${event.id}`}
                      className="rounded-2xl bg-card border border-border overflow-hidden hover:border-primary/40 transition-all"
                    >
                      {/* Event header with date band */}
                      <div className="bg-primary/10 px-5 py-3 flex items-center justify-between border-b border-border">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-primary" />
                          <span className="text-sm font-semibold text-primary">{formatDate(event.date)}</span>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          isNear
                            ? "bg-accent/20 text-accent"
                            : "bg-secondary text-muted-foreground"
                        }`}>
                          {daysAway}
                        </span>
                      </div>

                      {/* Event body */}
                      <div className="p-5">
                        <h3 className="font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>{event.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{event.description}</p>

                        <div className="flex flex-wrap gap-3 mb-4">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{event.venue}, {event.city}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{event.time}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-lg font-bold text-primary">${event.price}</p>
                            <p className="text-xs text-muted-foreground">per ticket</p>
                          </div>
                          <a
                            href={event.ticketUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            data-testid={`get-tickets-${event.id}`}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-all"
                          >
                            <Ticket className="w-4 h-4" />
                            Get Tickets
                            <ExternalLink className="w-3 h-3 opacity-70" />
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {pastEvents.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Past Shows</h2>
              <div className="space-y-3">
                {pastEvents.map(event => (
                  <div
                    key={event.id}
                    className="rounded-xl bg-card border border-border p-4 opacity-60"
                  >
                    <div className="flex items-start gap-3">
                      <Calendar className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{event.title}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(event.date)} • {event.venue}, {event.city}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {events.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
              <Ticket className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No events scheduled yet.</p>
              <p className="text-xs mt-1">Check back soon for upcoming shows.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
