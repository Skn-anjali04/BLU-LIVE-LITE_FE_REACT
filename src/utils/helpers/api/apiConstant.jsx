export const getLoginPath = "/api/v1/auth/login";
// export const getLoginPath = "/api/user/signIn";
//servertab
export const postCreateServerPath="/api/v1/ateme/addAtemeServer";
export const getServerListPath = "/api/v1/ateme/fetchServerList";
export const getAllServersPath="/api/v1/ateme/fetchServices";
export const getOperatorsPath="/api/v1/user/fetchUsers";
//user Tab
export const postaddUserPath="/api/v1/user/register";
export const getUsersPath="api/v1/user/fetchUsers";
export const postDeleteUser="/api/v1/user/deleteUser";
export const postAssignInstToUsersPath ="/api/v1/user/assignService";
export const postUnassignInstanceUserPath="/api/v1/user/unassignService";
//server Detail
export const postdeleteServerDetails="/api/v1/ateme/deleteServer"
export const getServerInfoPath="/api/v1/ateme/fetchAtemeServerDetails"
export const posteditServerPath="/api/v1/ateme/editAtemeServer"
//
//logstab
export const getlogsServices="/api/v1/logs/getServices"
export const downloadLogs="/api/v1/logs/downloadAsrun"
//
//this is for operater lobby
export const getUserInstancePath ="/api/v1/user/fetchUserServices"
//
//this is for a Dashbord Operater
export const getServiceConfig ="/api/v1/ateme/fetchServiceConfig"
export const getAtemeToken="/api/v1/ateme/fetchAtemeToken"
//this is for a  Scroller Dilog
export const getScroller="/api/v1/graphics/fetchScrolls";
export const postDelEditScrolleer="/api/v1/graphics/addScrolls"
//
//graphics
export const fatchGraphics="/api/v1/ateme/fetchGraphics"
export const postgraphicsStartStop="/api/v1/graphics/startStopGraphics"
export const postgraphicsSlateStop= "/api/v1/graphics/stopSlate"
export const postcueqout="/api/v1/graphics/cueOut"
export const postcuein="/api/v1/graphics/cueIn"
// log tab
export const postgetLogsPath ="/api/instance/getLogs"
//this is for operater lobby
// export const getUserInstancePath ="/api/instance/getUserInstances"
export const getInstanceConfigPath="/api/instance/getInstanceConfig"

//this is operader dashboard
export const getSlatesPath ="/api/graphics/getAllGraphics/"

//this is for scuty
export const getScteData="/api/v1/graphics/fetchCurrentSCTE"

//this is for a  Server Status
export const getStatusServer="/api/v1/ateme/getServiceStatus"