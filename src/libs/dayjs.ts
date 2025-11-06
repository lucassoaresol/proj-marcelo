import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import duration from "dayjs/plugin/duration.js";
import localizedFormat from "dayjs/plugin/localizedFormat.js";
import relativeTime from "dayjs/plugin/relativeTime.js";

const dayLib = dayjs;

dayLib.locale("pt-br");
dayLib.extend(localizedFormat);
dayLib.extend(relativeTime);
dayjs.extend(duration);

export default dayLib;
