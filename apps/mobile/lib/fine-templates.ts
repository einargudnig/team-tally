export interface FineTemplate {
  name: string;
  amount: number;
  cadence: "one_off" | "monthly";
  preChecked: boolean;
}

export const fineTemplates: FineTemplate[] = [
  { name: "Late to practice", amount: 500, cadence: "one_off", preChecked: true },
  { name: "Late to game", amount: 1000, cadence: "one_off", preChecked: true },
  { name: "Missed practice (no notice)", amount: 2000, cadence: "one_off", preChecked: true },
  { name: "Phone out in team meeting", amount: 500, cadence: "one_off", preChecked: true },
  { name: "Lost team gear", amount: 1500, cadence: "one_off", preChecked: false },
  { name: "Yellow card", amount: 500, cadence: "one_off", preChecked: false },
  { name: "Red card", amount: 2000, cadence: "one_off", preChecked: false },
  { name: "Birthday round (buyer)", amount: 0, cadence: "monthly", preChecked: false },
];
