interface CommonLabelProps {
  text: string;
}

const CommonLabel = ({ text }: CommonLabelProps) => {

  return (
    <div
      className="md:z-50 bg-transparent text-transparent bg-clip-text bg-gradient-to-r from-[#41B7FC] via-[#44B5FB] to-[#46F1FA] border-[2px] rounded-3xl font-sfpro text-lg w-[120px] md:w-[220px] flex items-center justify-center px-0 lg:px-2 py-2 font-semibold text-black hover:text-[#FEFFB5] hover:bg-black text-center"
    >
      {text}
    </div>
  );
};

export const BookTableBtn = () => (
  <CommonLabel text="Get Started" />
);

export const ViewAllBtn = () => <CommonLabel text="VIEW ALL" />;

export default CommonLabel;
