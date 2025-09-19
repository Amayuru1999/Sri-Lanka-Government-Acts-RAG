import tag from "/assets/images/name_tag.webp";

interface TeamCardProps {
  name: string;
  description: string;
}

function TeamCard({ name, description }: TeamCardProps) {
  return (
    <div className='flex flex-col gap-2 p-5 border bg-black rounded-3xl w-[140px] md:w-[160px] lg:w-[200px] h-[100px] lg:h-[120px]'>
      {/* name */}
      <div className="flex items-center gap-2">
        <img src={tag} alt="tag" className="w-5 h-5" />
        <p className="font-sans text-white text-xs md:text-sm lg:text-base">{name}</p>
      </div>
      {/* desc */}
      <p className="font-sans text-white opacity-60 text-xs lg:text-sm">{description}</p>
    </div>
  )
}

export default TeamCard
