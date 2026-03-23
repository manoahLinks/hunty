"use client";

import React, { useEffect, useState } from "react";
import Joyride, { Step, CallBackProps, STATUS } from "react-joyride";

const OnboardingTour: React.FC = () => {
  const [run, setRun] = useState(false);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem("hasSeenOnboardingTour");
    if (!hasSeenTour) {
      setRun(true);
    }
  }, []);

  const steps: Step[] = [
    {
      target: "#wallet-button",
      content: "First, connect your wallet to start playing and earning rewards.",
      disableBeacon: true,
    },
    {
      target: "#play-button",
      content: "Once connected, you can browse and play active hunts.",
    },
    {
      target: "#balance-pill",
      content: "Track your earnings right here in your dashboard header.",
    },
  ];

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    if (([STATUS.FINISHED, STATUS.SKIPPED] as string[]).includes(status)) {
      localStorage.setItem("hasSeenOnboardingTour", "true");
      setRun(false);
    }
  };

  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous
      hideCloseButton
      run={run}
      scrollToFirstStep
      showProgress
      showSkipButton
      steps={steps}
      styles={{
        options: {
          primaryColor: "#3737A4",
          zIndex: 1000,
        },
      }}
    />
  );
};

export default OnboardingTour;
