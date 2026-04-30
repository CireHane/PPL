export const timesAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);

    if(weeks > 0){
        return `${weeks} weeks ago`;
    }
    else if(days > 0){
        return `${days} days ago`
    }
    else if(hours > 0){
        return `${hours} hours ago`
    }
    else if(minutes > 0){
        return `${minutes} minutes ago`
    }
    else if(seconds > 0){
        return `${seconds} seconds ago`
    }
}

export const timeFormat = (date) => {
    const pad = (num) => String(num).padStart(2, '0');
  
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1); // Months are 0-indexed
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const min = pad(date.getMinutes());

    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

export const timeNow = () => {
    return new Date().getTime() + (7 * 60 * 60 * 1000)
}