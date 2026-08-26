import { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export default function Container({
  children,
}: Props) {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-8 lg:px-12 xl:px-16">
      {children}
    </div>
  );
}