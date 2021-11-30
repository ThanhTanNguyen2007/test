import { format } from 'date-fns';
export const formatDatetime = (datetimeString: string | null) => {
    if (!datetimeString) {
      return '';
    }
    return format(new Date(datetimeString), 'd MMM yyyy, HH:mm');
  };