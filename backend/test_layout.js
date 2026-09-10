const { generateLayout } = require('./services/layoutEngine');
const { validateLayout } = require('./services/layoutValidator');

const testCases = [
  {
    name: "User Example: 30x46 ft - Living Room + 2 Bedrooms + Kitchen + Bathroom",
    plot: { width: 30, length: 46, unit: 'ft' },
    selectedFloors: ['ground'],
    rooms: [
      { type: 'Living Room', quantity: 1 },
      { type: 'Bedroom', quantity: 2 },
      { type: 'Kitchen', quantity: 1 },
      { type: 'Bathroom', quantity: 1 }
    ]
  },
  {
    name: "Small Plot: 20x30 ft - Living Room + Bedroom + Kitchen + Bathroom",
    plot: { width: 20, length: 30, unit: 'ft' },
    selectedFloors: ['ground'],
    rooms: [
      { type: 'Living Room', quantity: 1 },
      { type: 'Bedroom', quantity: 1 },
      { type: 'Kitchen', quantity: 1 },
      { type: 'Bathroom', quantity: 1 }
    ]
  },
  {
    name: "Standard Plot: 30x40 ft - Living Room + 2 Bedrooms + Kitchen + Dining + Bathroom",
    plot: { width: 30, length: 40, unit: 'ft' },
    selectedFloors: ['ground'],
    rooms: [
      { type: 'Living Room', quantity: 1 },
      { type: 'Bedroom', quantity: 2 },
      { type: 'Kitchen', quantity: 1 },
      { type: 'Dining Room', quantity: 1 },
      { type: 'Bathroom', quantity: 1 }
    ]
  },
  {
    name: "Large Plot: 40x60 ft - Living Room + 3 Bedrooms + Kitchen + Dining + 2 Bathrooms",
    plot: { width: 40, length: 60, unit: 'ft' },
    selectedFloors: ['ground'],
    rooms: [
      { type: 'Living Room', quantity: 1 },
      { type: 'Master Bedroom', quantity: 1 },
      { type: 'Bedroom', quantity: 2 },
      { type: 'Kitchen', quantity: 1 },
      { type: 'Dining Room', quantity: 1 },
      { type: 'Bathroom', quantity: 2 }
    ]
  },
  {
    name: "Custom Selection (No Living): 2 Bedrooms + Kitchen + Bathroom",
    plot: { width: 30, length: 40, unit: 'ft' },
    selectedFloors: ['ground'],
    rooms: [
      { type: 'Bedroom', quantity: 2 },
      { type: 'Kitchen', quantity: 1 },
      { type: 'Bathroom', quantity: 1 }
    ]
  },
  {
    name: "Ground + First Floor Duplex: 30x40 ft",
    plot: { width: 30, length: 40, unit: 'ft' },
    selectedFloors: ['ground', 'first'],
    floorRequirements: {
      ground: [
        { type: 'Living Room', quantity: 1 },
        { type: 'Kitchen', quantity: 1 },
        { type: 'Dining Room', quantity: 1 },
        { type: 'Bathroom', quantity: 1 },
        { type: 'Staircase', quantity: 1 }
      ],
      first: [
        { type: 'Master Bedroom', quantity: 1 },
        { type: 'Bedroom', quantity: 1 },
        { type: 'Living Room', quantity: 1 },
        { type: 'Bathroom', quantity: 1 },
        { type: 'Balcony', quantity: 1 },
        { type: 'Staircase', quantity: 1 }
      ]
    }
  }
];

console.log("================== RUNNING LAYOUT ENGINE TESTS ==================\n");

let allPassed = true;

testCases.forEach((tc, idx) => {
  console.log(`--- Test Case #${idx + 1}: ${tc.name} ---`);
  const layout = generateLayout(tc);
  const val = validateLayout(layout);

  console.log(`Plot: ${layout.plot.width}x${layout.plot.length} (${layout.plot.totalArea} sq.ft)`);
  console.log(`Floors generated: ${layout.floors.length}`);

  layout.floors.forEach((f) => {
    console.log(`  [Floor: ${f.floor}]`);
    let totalRoomArea = 0;
    f.rooms.forEach((r) => {
      console.log(`    - ${r.name} (${r.type}): x=${r.x}, y=${r.y}, w=${r.width}, h=${r.height} | Area: ${r.area} sq.ft | Doors: ${r.doors.length}, Windows: ${r.windows.length}`);
      totalRoomArea += r.area;
    });
    if (f.layoutFailures && f.layoutFailures.length) {
      console.log(`    FAILURES in ${f.floor}:`, f.layoutFailures);
    }
    console.log(`    Total Floor Room Area: ${Math.round(totalRoomArea * 10) / 10} / Plot Area: ${layout.plot.totalArea}`);
    console.log(`    Space Utilization: ${Math.round((totalRoomArea / layout.plot.totalArea) * 100)}%`);
  });

  if (val.isValid && !layout.validationFailed) {
    console.log(`  >>> STATUS: PASSED VALIDATION ✅\n`);
  } else {
    console.log(`  >>> STATUS: FAILED ❌`);
    console.log(`  Errors:`, val.errors || layout.warnings);
    allPassed = false;
  }
});

if (allPassed) {
  console.log("================== ALL TEST CASES PASSED! ==================");
} else {
  console.log("================== SOME TEST CASES FAILED ==================");
  process.exit(1);
}
