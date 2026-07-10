import { SelectHTMLAttributes } from "react";
import { componentVariants } from "../../design";
export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) { return <select className={componentVariants.input} {...props} />; }
export const Dropdown = Select;
