import { createContext } from "react";

interface StepStatus {
  isCurrentStep: boolean;
  isCompleted: boolean;
  isLastStep: boolean;
}

interface CreateJobContext {
  state: WizardState;
  dispatch: (action: ReducerAction) => void;
  getStepStatus: (stepName: Steps) => StepStatus;
  goBack: () => void;
  goNext: () => void;
  currentStep: Steps;
}

export const defaultState: WizardState = {
  step1: "editing",
  step2: "initial",
  step3: "initial",
  step4: "initial",
  nextStep: "step2",
  previousStep: null,
  direction: null,
};

export const CreateJobContext = createContext<CreateJobContext>({
  state: defaultState,
  dispatch: () => {
    /** This will get replaced when update the value at mount */
  },
  getStepStatus: getStepStatus(defaultState),
  goBack: goBack(defaultState, () => {
    /** Does nothing */
  }),
  goNext: goNext(defaultState, () => {
    /** Does nothing */
  }),
  currentStep: getCurrentStep(defaultState),
});

export function getStepStatus(state: WizardState) {
  return (stepName: Steps): StepStatus => {
    const isCurrentStep = state[stepName] === "editing";
    const isCompleted = state[stepName] === "complete";
    const isLastStep = stepName === "step4" && state[stepName] === "editing";

    return {
      isCurrentStep,
      isCompleted,
      isLastStep,
    };
  };
}

export function getCurrentStep(state: WizardState): Steps {
  const tupleState = Object.entries(state).find(([, value]) => {
    return value === "editing";
  });

  if (tupleState === undefined) {
    return "step1";
  }

  return tupleState[0] as Steps;
}

export function goNext(
  state: WizardState,
  dispatch: (action: ReducerAction) => void,
) {
  return () => {
    if (state.nextStep === null) {
      return;
    }

    dispatch({ type: `go_to:${state.nextStep}`, direction: "forward" });
  };
}

export function goBack(
  state: WizardState,
  dispatch: (action: ReducerAction) => void,
) {
  return () => {
    if (state.previousStep === null) {
      return;
    }

    dispatch({ type: `go_to:${state.previousStep}`, direction: "backward" });
  };
}

export type Steps = "step1" | "step2" | "step3" | "step4";

export type WizardState = {
  step1: "initial" | "editing" | "complete";
  step2: "initial" | "editing" | "complete";
  step3: "initial" | "editing" | "complete";
  step4: "initial" | "editing" | "complete";
  nextStep: Steps | null;
  previousStep: Steps | null;
  direction: "forward" | "backward" | null;
};

type ReducerAction = {
  type: "go_to:step1" | "go_to:step2" | "go_to:step3" | "go_to:step4";
  direction: "forward" | "backward";
};

export function reducer(_: WizardState, action: ReducerAction): WizardState {
  switch (action.type) {
    case "go_to:step1":
      return {
        step1: "editing",
        step2: "initial",
        step3: "initial",
        step4: "initial",
        nextStep: "step2",
        previousStep: null,
        direction: action.direction,
      };
    case "go_to:step2":
      return {
        step1: "complete",
        step2: "editing",
        step3: "initial",
        step4: "initial",
        nextStep: "step3",
        previousStep: "step1",
        direction: action.direction,
      };
    case "go_to:step3":
      return {
        step1: "complete",
        step2: "complete",
        step3: "editing",
        step4: "initial",
        nextStep: "step4",
        previousStep: "step2",
        direction: action.direction,
      };
    case "go_to:step4":
      return {
        step1: "complete",
        step2: "complete",
        step3: "complete",
        step4: "editing",
        nextStep: null,
        previousStep: "step3",
        direction: action.direction,
      };

    default:
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      throw `Unhandled action type: ${action.type}`;
  }
}
