import {buffer} from './social/automation/lib/buffer.mjs';
const org='6aa44066ad2abb79fc51766e',channel='6aa44144cd8b9c702c4f2f4c';
console.log(await buffer('query($org:OrganizationId!){channels(input:{organizationId:$org}){id name service}}',{org}));
console.log(JSON.stringify(await buffer(`query($org:OrganizationId!,$channel:ChannelId!,$after:String){posts(first:100,after:$after,input:{organizationId:$org,filter:{channelIds:[$channel],status:[sent]}}){edges{node{id text externalLink sentAt status metrics{type value} metricsUpdatedAt}}pageInfo{hasNextPage endCursor}}}`,{org,channel}),null,2));
