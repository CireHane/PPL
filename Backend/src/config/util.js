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

/**
 * Return current time (WIB) in milliseconds
 */
export const timeNow = () => {
    return new Date().getTime() + (7 * 60 * 60 * 1000)
}

/**
 * Creates query string with paramaterize query, $ marks input in query.
 * use AND or OR before a condition
 * 
 * Example: createQuery("SELECT * FROM users", ["username = $", "and", "password = $", "order by username", "asc"])
 * @param {string} query 
 * @param {string[]} conditions 
 * @returns {string}
 */
export const createQuery = (query, conditions) => {
    var res = query;
    if(conditions.length == 0)
        return res;
    
    conditions = conditions.filter(x => x != null);
    conditions = conditions.map(x => x.toLowerCase());

    if(conditions[0] == "and" || conditions[0] == "or")
        conditions.shift()

    if(conditions.length == 0)
        return res;
    
    if(!conditions[0].includes('order by'))
        res += " WHERE";

    var index = 0;
    for(var i in conditions){
        if(conditions[i].includes('$'))
            res += conditions[i].replace("$", `$${++index}`);
        else
            res += conditions;
    }
    
    return res;
}