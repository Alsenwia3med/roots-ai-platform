export const DRIVER_WORDING = {
  single: (primary: string) => 
    `The highest-ranked driver in this assessment is ${primary}.`,
  multiple: (drivers: string) => 
    `The highest-ranked drivers in this assessment are ${drivers}.`
};

export const TRIAD_WORDING = {
  twoElements: (first: string, second: string) => 
    `The available information brings together ${first} and ${second}.`,
  oneElement: (first: string) => 
    `Only ${first} is available for this view.`,
  none: "Not enough information is available to display this view."
};

export const TRIAD_RELATIONSHIP_NOTE = 
  "The diagram shows possible relationships between these areas, not causes.";
