import { isTriggerDue } from '../lib/automation-helper';

function test() {
    const schedules = [
        { day: 'Everyday', time: '13:06' },
        { day: 'Sunday', time: '13:06' }
    ];

    const tz = 'Asia/Karachi';

    // Simulating 2026-02-22T08:06:00Z (which is 13:06 PKT)
    const simulatedNow = new Date('2026-02-22T08:06:00Z');

    console.log(`Simulated UTC Time: ${simulatedNow.toISOString()}`);
    console.log(`User Timezone: ${tz}`);

    const resultNormal = isTriggerDue(schedules, tz, simulatedNow);
    console.log(`Is Due (Exact)? ${resultNormal}`);

    // Simulating 2026-02-22T08:10:00Z (which is 13:10 PKT, a 4-minute delay)
    const delayedNow = new Date('2026-02-22T08:10:00Z');
    const resultDelayed = isTriggerDue(schedules, tz, delayedNow);
    console.log(`Is Due (4min delay)? ${resultDelayed}`);
}

test();
