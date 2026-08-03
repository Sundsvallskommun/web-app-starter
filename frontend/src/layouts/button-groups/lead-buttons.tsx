import { Button } from '@sk-web-gui/react';
import { ReactNode } from 'react';

interface LeadButtonsProps {
  children?: ReactNode;
}

const LeadButtons = ({ children }: LeadButtonsProps) => {
  return (
    <Button.Group className="flex flex-col mt-[40px] gap-md sm:flex-row sm:grid sm:grid-cols-2 sm:gap-[40px]">
      {children}
    </Button.Group>
  );
};

export default LeadButtons;
