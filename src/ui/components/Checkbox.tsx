import CheckIcon from "@mui/icons-material/Check";

interface CheckboxProps {
  label: string;
  iconColor?: string;
  bgColor?: string;
}

export default function Checkbox({
  label,
  iconColor = "white",
  bgColor = "bg-green-700",
}: CheckboxProps) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-5 h-5 ${bgColor} flex items-center justify-center rounded text-sm`}
        aria-label="Checked"
      >
        <CheckIcon style={{ color: iconColor, fontSize: "16px" }} />
      </div>
      <p className="text-white text-lg">{label}</p>
    </div>
  );
}
