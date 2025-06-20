const severityVal: Record<string, number>={
    critical: 0,
    high: 1,
    medium: 2,
    low:3,
    info:4
}

export const sortSeverity = (list: any[]): any[] =>{ 
    return list.sort((a,b) =>{
        return severityVal[a.severity || a.name] - severityVal[b.severity || b.name]
    })
}
