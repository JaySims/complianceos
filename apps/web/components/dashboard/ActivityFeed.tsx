"use client";

type Activity = {
  title: string;
  time: string;
};

type Props = {
  activities?: Activity[];
};

export default function ActivityFeed({
  activities = [],
}: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">

      <h3 className="mb-6 text-xl font-bold text-slate-900">
        Recent Activity
      </h3>

      {activities.length === 0 ? (

        <div className="py-12 text-center text-slate-500">

          No activity available yet.

        </div>

      ) : (

        <div className="space-y-5">

          {activities.map((activity, index) => (

            <div
              key={index}
              className="flex items-start gap-4"
            >

              <div className="mt-2 h-3 w-3 rounded-full bg-blue-600" />

              <div>

                <p className="font-medium text-slate-800">

                  {activity.title}

                </p>

                <p className="mt-1 text-sm text-slate-500">

                  {activity.time}

                </p>

              </div>

            </div>

          ))}

        </div>

      )}

    </div>
  );
}
