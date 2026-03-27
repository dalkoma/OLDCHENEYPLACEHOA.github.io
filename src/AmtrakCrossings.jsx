import { useState, useMemo } from "react";

const CROSSING_DATA = [{"name":"Lincoln, NE to Ashland, NE","subdivision":"BNSF Creston Subdivision","crossings":[{"id":"933645L","mp":"58.460","street":"ANTELOPE VALLEY","city":"LINCOLN","county":"LANCASTER","lat":"40.8272240","lng":"-96.698963","warning":"Passive","tracks":"1"},{"id":"933644E","mp":"58.100","street":"SALT CREEK RDWY","city":"LINCOLN","county":"LANCASTER","lat":"40.8282300","lng":"-96.697074","warning":"Passive","tracks":"1"},{"id":"064127R","mp":"57.400","street":"27TH ST","city":"LINCOLN","county":"LANCASTER","lat":"40.8355800","lng":"-96.682129","warning":"Passive","tracks":"1"},{"id":"064128X","mp":"56.800","street":"33RD ST","city":"LINCOLN","county":"LANCASTER","lat":"40.8410066","lng":"-96.672809","warning":"Gates","tracks":"2"},{"id":"064129E","mp":"56.610","street":"Adams Street","city":"LINCOLN","county":"LANCASTER","lat":"40.8426367","lng":"-96.669706","warning":"Gates","tracks":"2"},{"id":"074860A","mp":"55.920","street":"44TH ST","city":"LINCOLN","county":"LANCASTER","lat":"40.8483245","lng":"-96.658871","warning":"Gates","tracks":"2"},{"id":"074861G","mp":"55.560","street":"48TH ST","city":"LINCOLN","county":"LANCASTER","lat":"40.8510630","lng":"-96.653624","warning":"Passive","tracks":"1"},{"id":"074859F","mp":"54.840","street":"HAVELOCK AVE","city":"LINCOLN","county":"LANCASTER","lat":"40.8571490","lng":"-96.642239","warning":"Passive","tracks":"1"},{"id":"074929T","mp":"53.720","street":"North 70TH Street","city":"LINCOLN","county":"LANCASTER","lat":"40.8662860","lng":"-96.624685","warning":"Gates","tracks":"2"},{"id":"098443J","mp":"52.450","street":"84TH ST","city":"LINCOLN","county":"LANCASTER","lat":"40.8774800","lng":"-96.603200","warning":"Gates","tracks":"2"},{"id":"074934P","mp":"51.330","street":"N 98TH ST","city":"LINCOLN","county":"LANCASTER","lat":"40.8863325","lng":"-96.5864018","warning":"Gates","tracks":"2"},{"id":"074936D","mp":"50.150","street":"I-80","city":"WAVERLY","county":"LANCASTER","lat":"40.8958890","lng":"-96.567349","warning":"Passive","tracks":"1"},{"id":"074938S","mp":"49.600","street":"N 120TH ST","city":"WAVERLY","county":"LANCASTER","lat":"40.9006600","lng":"-96.559063","warning":"Crossbuck","tracks":"2"},{"id":"928118G","mp":"48.152","street":"CANONGATE ROAD","city":"WAVERLY","county":"LANCASTER","lat":"40.9129943","lng":"-96.535602","warning":"Passive","tracks":"1"},{"id":"074940T","mp":"47.733","street":"N 141ST ST","city":"WAVERLY","county":"LANCASTER","lat":"40.9160655","lng":"-96.529650","warning":"Gates","tracks":"2"},{"id":"074942G","mp":"47.186","street":"N 148TH ST","city":"WAVERLY","county":"LANCASTER","lat":"40.9205917","lng":"-96.520938","warning":"Gates","tracks":"2"},{"id":"074945C","mp":"45.960","street":"N 162ND ST","city":"WAVERLY","county":"LANCASTER","lat":"40.9306780","lng":"-96.501711","warning":"Gates","tracks":"2"},{"id":"074951F","mp":"42.297","street":"4TH ST","city":"GREENWOOD","county":"CASS","lat":"40.9605101","lng":"-96.443948","warning":"Gates","tracks":"2"},{"id":"074952M","mp":"42.080","street":"MAIN ST","city":"GREENWOOD","county":"CASS","lat":"40.9627560","lng":"-96.441722","warning":"Gates","tracks":"2"},{"id":"074954B","mp":"40.940","street":"STACEY LN","city":"GREENWOOD","county":"CASS","lat":"40.9758400","lng":"-96.428600","warning":"Crossbuck","tracks":"2"},{"id":"074956P","mp":"39.910","street":"220TH Street","city":"GREENWOOD","county":"CASS","lat":"40.9877916","lng":"-96.4166089","warning":"Crossbuck","tracks":"2"},{"id":"074957W","mp":"39.060","street":"226TH ST","city":"GREENWOOD","county":"CASS","lat":"40.9975740","lng":"-96.406825","warning":"Gates","tracks":"2"},{"id":"074959K","mp":"37.420","street":"CO RD 5","city":"ASHLAND","county":"SAUNDERS","lat":"41.0165770","lng":"-96.387753","warning":"Passive","tracks":"1"},{"id":"074960E","mp":"36.130","street":"SH NE 63","city":"ASHLAND","county":"SAUNDERS","lat":"41.0299910","lng":"-96.370926","warning":"Passive","tracks":"1"},{"id":"928117A","mp":"35.800","street":"ST HWY 66","city":"ASHLAND","county":"SAUNDERS","lat":"41.0338000","lng":"-96.365682","warning":"Passive","tracks":"1"},{"id":"074961L","mp":"35.240","street":"SILVER ST","city":"ASHLAND","county":"SAUNDERS","lat":"41.0390190","lng":"-96.358505","warning":"Passive","tracks":"1"},{"id":"073005K","mp":"34.108","street":"US HWY 6","city":"ASHLAND","county":"SAUNDERS","lat":"41.0490260","lng":"-96.341666","warning":"Passive","tracks":"1"},{"id":"073008F","mp":"31.100","street":"I-80 WB","city":"SOUTH BEND","county":"CASS","lat":"41.0238170","lng":"-96.299995","warning":"Passive","tracks":"1"},{"id":"073009M","mp":"31.090","street":"I-80 EB","city":"SOUTH BEND","county":"CASS","lat":"41.0238170","lng":"-96.299995","warning":"Passive","tracks":"1"},{"id":"073015R","mp":"23.370","street":"SH NE 50","city":"LOUISVILLE","county":"CASS","lat":"41.0018990","lng":"-96.167503","warning":"Passive","tracks":"1"},{"id":"073016X","mp":"23.070","street":"MAIN ST","city":"LOUISVILLE","county":"CASS","lat":"41.0033960","lng":"-96.162026","warning":"Gates","tracks":"1"},{"id":"073017E","mp":"22.930","street":"WALNUT ST","city":"LOUISVILLE","county":"CASS","lat":"41.0042560","lng":"-96.159696","warning":"Gates","tracks":"1"},{"id":"073019T","mp":"19.020","street":"PLATTE VIEW DR","city":"CEDAR CREEK","county":"CASS","lat":"41.0377170","lng":"-96.101132","warning":"Gates","tracks":"1"},{"id":"073022B","mp":"14.380","street":"72ND ST","city":"PLATTSMOUTH","county":"CASS","lat":"41.0552300","lng":"-96.023700","warning":"Gates","tracks":"2"},{"id":"072945V","mp":"10.461","street":"TREASURE ISLAND RD","city":"PLATTSMOUTH","county":"CASS","lat":"41.0516391","lng":"-95.951824","warning":"Gates","tracks":"1"},{"id":"073073L","mp":"8.876","street":"US 73 / 75","city":"PLATTSMOUTH","county":"CASS","lat":"41.0478000","lng":"-95.921300","warning":"Passive","tracks":"1"},{"id":"073074T","mp":"8.853","street":"US 73 / 75","city":"PLATTSMOUTH","county":"CASS","lat":"41.0478000","lng":"-95.921300","warning":"Passive","tracks":"1"},{"id":"073075A","mp":"8.697","street":"BEACH RD","city":"PLATTSMOUTH","county":"CASS","lat":"41.0473760","lng":"-95.918380","warning":"Gates","tracks":"2"},{"id":"072935P","mp":"6.039","street":"W 'O' ST","city":"LINCOLN","county":"LANCASTER","lat":"40.8136630","lng":"-96.808465","warning":"Passive","tracks":"1"},{"id":"073078V","mp":"4.926","street":"MAIN ST","city":"PLATTSMOUTH","county":"CASS","lat":"41.0111900","lng":"-95.881100","warning":"Gates","tracks":"1"},{"id":"070134P","mp":"1.014","street":"OSTREET","city":"LINCOLN","county":"LANCASTER","lat":"40.8136050","lng":"-96.711554","warning":"Passive","tracks":"1"},{"id":"064376W","mp":".384","street":"I-180","city":"LINCOLN","county":"LANCASTER","lat":"40.8201180","lng":"-96.709071","warning":"Passive","tracks":"1"},{"id":"064377D","mp":".193","street":"10TH ST","city":"LINCOLN","county":"LANCASTER","lat":"40.8230890","lng":"-96.706942","warning":"Passive","tracks":"1"}]},{"name":"Ashland, NE to Omaha, NE","subdivision":"BNSF Omaha Subdivision","crossings":[{"id":"073156A","mp":"45.262","street":"RD A","city":"ASHLAND","county":"SAUNDERS","lat":"41.0576275","lng":"-96.333052","warning":"Gates","tracks":"1"},{"id":"073158N","mp":"44.320","street":"255TH ST","city":"ASHLAND","county":"SARPY","lat":"41.0660800","lng":"-96.318700","warning":"Gates","tracks":"1"},{"id":"928130N","mp":"43.733","street":"252ND ST","city":"ASHLAND","county":"SAUNDERS","lat":"41.0740000","lng":"-96.306000","warning":"Gates","tracks":"1"},{"id":"073161W","mp":"41.890","street":"234TH ST","city":"ASHLAND","county":"SARPY","lat":"41.0879200","lng":"-96.281874","warning":"Passive","tracks":"1"},{"id":"073162D","mp":"41.250","street":"MELIA RD","city":"GRETNA","county":"SARPY","lat":"41.0958740","lng":"-96.276182","warning":"Gates","tracks":"1"},{"id":"073163K","mp":"40.740","street":"FAIRVIEW RD","city":"GRETNA","county":"SARPY","lat":"41.1031120","lng":"-96.273757","warning":"Crossbuck","tracks":"1"},{"id":"073165Y","mp":"39.720","street":"CAPEHART RD","city":"GRETNA","county":"SARPY","lat":"41.1177030","lng":"-96.272549","warning":"Gates","tracks":"1"},{"id":"073168U","mp":"38.420","street":"SCHRAM RD","city":"GRETNA","county":"SARPY","lat":"41.1323400","lng":"-96.256900","warning":"Gates","tracks":"1"},{"id":"073169B","mp":"38.050","street":"216TH ST","city":"GRETNA","county":"SARPY","lat":"41.1371700","lng":"-96.253300","warning":"Gates","tracks":"1"},{"id":"073170V","mp":"37.850","street":"ANGUS RD","city":"GRETNA","county":"SARPY","lat":"41.1395970","lng":"-96.2516620","warning":"Passive","tracks":"1"},{"id":"073172J","mp":"37.200","street":"GRUENTHER RD","city":"GRETNA","county":"SARPY","lat":"41.1468860","lng":"-96.243728","warning":"Gates","tracks":"1"},{"id":"073173R","mp":"36.920","street":"US HWY 6","city":"GRETNA","county":"SARPY","lat":"41.1488370","lng":"-96.239056","warning":"Passive","tracks":"1"},{"id":"073176L","mp":"35.000","street":"192ND ST","city":"GRETNA","county":"SARPY","lat":"41.1696480","lng":"-96.215475","warning":"Passive","tracks":"1"},{"id":"979299D","mp":"34.206","street":"GILES RD","city":"OMAHA","county":"DOUGLAS","lat":"41.1760800","lng":"-96.2028900","warning":"Passive","tracks":"0"},{"id":"977695M","mp":"33.774","street":"180TH STREET","city":"OMAHA","county":"DOUGLAS","lat":"41.1788100","lng":"-96.1910300","warning":"Passive","tracks":"1"},{"id":"073181H","mp":"32.770","street":"168TH ST","city":"LA VISTA","county":"SARPY","lat":"41.1837670","lng":"-96.177415","warning":"Passive","tracks":"1"},{"id":"073182P","mp":"31.760","street":"156TH ST","city":"RALSTON","county":"SARPY","lat":"41.1845300","lng":"-96.158300","warning":"Gates","tracks":"1"},{"id":"073185K","mp":"30.730","street":"144TH ST","city":"LA VISTA","county":"SARPY","lat":"41.1809460","lng":"-96.138979","warning":"Passive","tracks":"1"},{"id":"073036J","mp":"29.740","street":"132ND ST","city":"LA VISTA","county":"SARPY","lat":"41.1774433","lng":"-96.121031","warning":"Gates","tracks":"1"},{"id":"073038X","mp":"29.710","street":"I-80 WB","city":"LA VISTA","county":"SARPY","lat":"41.1768670","lng":"-96.120346","warning":"Passive","tracks":"1"},{"id":"073037R","mp":"29.700","street":"I-80 EB","city":"GRETNA","county":"SARPY","lat":"41.1770790","lng":"-96.119774","warning":"Passive","tracks":"1"},{"id":"073039E","mp":"29.499","street":"GILES RD","city":"LA VISTA","county":"SARPY","lat":"41.1761223","lng":"-96.116271","warning":"Gates","tracks":"1"},{"id":"916752G","mp":"29.218","street":"126TH ST","city":"LA VISTA","county":"SARPY","lat":"41.1752196","lng":"-96.111002","warning":"Gates","tracks":"1"},{"id":"983746J","mp":"28.646","street":"GILES RD","city":"RALSTON","county":"DOUGLAS","lat":"41.1772300","lng":"-96.1006000","warning":"Passive","tracks":"1"},{"id":"924668U","mp":"27.460","street":"108TH ST","city":"GRETNA","county":"SARPY","lat":"41.1822830","lng":"-96.081587","warning":"Passive","tracks":"1"},{"id":"924662D","mp":"26.73","street":"PED XING","city":"GRETNA","county":"SARPY","lat":"41.184041","lng":"-96.068472","warning":"Passive","tracks":"1"},{"id":"983745C","mp":"26.272","street":"S 96TH ST","city":"RALSTON","county":"DOUGLAS","lat":"41.1881700","lng":"-96.0619700","warning":"Passive","tracks":"1"},{"id":"073045H","mp":"25.980","street":"HARRISON ST","city":"RALSTON","county":"DOUGLAS","lat":"41.1908010","lng":"-96.057347","warning":"Passive","tracks":"1"},{"id":"073046P","mp":"25.580","street":"90TH ST","city":"OMAHA","county":"DOUGLAS","lat":"41.1952022","lng":"-96.052398","warning":"Gates","tracks":"1"},{"id":"073047W","mp":"25.030","street":"84TH ST","city":"RALSTON","county":"DOUGLAS","lat":"41.1984890","lng":"-96.043072","warning":"Passive","tracks":"1"},{"id":"073048D","mp":"24.443","street":"77TH ST","city":"RALSTON","county":"DOUGLAS","lat":"41.1993400","lng":"-96.031900","warning":"Gates","tracks":"1"},{"id":"073050E","mp":"24.010","street":"72ND ST","city":"OMAHA","county":"DOUGLAS","lat":"41.1990470","lng":"-96.023800","warning":"Passive","tracks":"1"},{"id":"073051L","mp":"23.120","street":"60TH ST","city":"OMAHA","county":"DOUGLAS","lat":"41.1984090","lng":"-96.006475","warning":"Passive","tracks":"1"},{"id":"074518M","mp":"21.950","street":"48TH ST","city":"OMAHA","county":"DOUGLAS","lat":"41.1942764","lng":"-95.986630","warning":"Gates","tracks":"1"},{"id":"074717P","mp":"21.020","street":"WEST Q ST","city":"OMAHA","county":"DOUGLAS","lat":"41.2055540","lng":"-95.977197","warning":"Passive","tracks":"1"},{"id":"074718W","mp":"20.870","street":"41ST ST","city":"OMAHA","county":"DOUGLAS","lat":"41.2071860","lng":"-95.975123","warning":"Passive","tracks":"1"},{"id":"074716H","mp":"20.640","street":"39TH ST","city":"OMAHA","county":"DOUGLAS","lat":"41.2091140","lng":"-95.971726","warning":"Passive","tracks":"1"},{"id":"074715B","mp":"20.370","street":"W","city":"OMAHA","county":"DOUGLAS","lat":"41.2124670","lng":"-95.969137","warning":"Passive","tracks":"1"},{"id":"074710S","mp":"20.050","street":"S 36TH ST","city":"OMAHA","county":"DOUGLAS","lat":"41.2166330","lng":"-95.966408","warning":"Passive","tracks":"1"},{"id":"074712F","mp":"20.040","street":"36TH ST","city":"OMAHA","county":"DOUGLAS","lat":"41.2168040","lng":"-95.966545","warning":"Passive","tracks":"1"},{"id":"074707J","mp":"19.770","street":"\"F\" ST","city":"OMAHA","county":"DOUGLAS","lat":"41.2200000","lng":"-95.963333","warning":"Passive","tracks":"1"},{"id":"074719D","mp":"19.480","street":"DAHLMAN AVE","city":"OMAHA","county":"DOUGLAS","lat":"41.2176320","lng":"-95.961024","warning":"Passive","tracks":"1"},{"id":"074706C","mp":"19.058","street":"I-80","city":"OMAHA","county":"DOUGLAS","lat":"41.2229120","lng":"-95.959448","warning":"Passive","tracks":"1"},{"id":"074704N","mp":"19.039","street":"I-480","city":"OMAHA","county":"DOUGLAS","lat":"41.2270000","lng":"-95.954340","warning":"Passive","tracks":"1"},{"id":"074701T","mp":"18.850","street":"VINTON ST","city":"OMAHA","county":"DOUGLAS","lat":"41.2296490","lng":"-95.952471","warning":"Passive","tracks":"1"},{"id":"074699U","mp":"18.520","street":"BANCROFT ST.","city":"OMAHA","county":"DOUGLAS","lat":"41.2342150","lng":"-95.950763","warning":"Passive","tracks":"1"},{"id":"074698M","mp":"18.200","street":"MARTHA ST","city":"OMAHA","county":"DOUGLAS","lat":"41.2391610","lng":"-95.950494","warning":"Passive","tracks":"1"},{"id":"074697F","mp":"18.040","street":"24TH ST","city":"OMAHA","county":"DOUGLAS","lat":"41.2418580","lng":"-95.947023","warning":"Passive","tracks":"1"},{"id":"074695S","mp":"17.790","street":"20TH ST","city":"OMAHA","county":"DOUGLAS","lat":"41.2431990","lng":"-95.942251","warning":"Passive","tracks":"1"},{"id":"074693D","mp":"17.300","street":"16TH ST","city":"OMAHA","county":"DOUGLAS","lat":"41.2493390","lng":"-95.937315","warning":"Passive","tracks":"1"},{"id":"074688G","mp":"17.090","street":"14TH ST","city":"OMAHA","county":"DOUGLAS","lat":"41.2504560","lng":"-95.934649","warning":"Passive","tracks":"1"},{"id":"074689N","mp":"17.010","street":"13TH ST","city":"OMAHA","county":"DOUGLAS","lat":"41.2508050","lng":"-95.933275","warning":"Passive","tracks":"1"},{"id":"074687A","mp":"16.870","street":"10TH ST","city":"OMAHA","county":"DOUGLAS","lat":"41.2506160","lng":"-95.929245","warning":"Passive","tracks":"1"},{"id":"074685L","mp":"16.590","street":"7TH ST","city":"OMAHA","county":"DOUGLAS","lat":"41.2494970","lng":"-95.925315","warning":"Passive","tracks":"1"},{"id":"074684E","mp":"16.506","street":"PACIFIC ST","city":"OMAHA","county":"DOUGLAS","lat":"41.2490810","lng":"-95.923865","warning":"Crossbuck","tracks":"2"},{"id":"074683X","mp":"16.390","street":"PIERCE ST","city":"OMAHA","county":"DOUGLAS","lat":"41.2480080","lng":"-95.922305","warning":"Passive","tracks":"1"},{"id":"074679H","mp":"16.010","street":"HICKORY ST","city":"OMAHA","county":"DOUGLAS","lat":"41.2428190","lng":"-95.918966","warning":"Passive","tracks":"1"},{"id":"933637U","mp":"15.969","street":"HICKORY ST","city":"OMAHA","county":"DOUGLAS","lat":"41.2431530","lng":"-95.918258","warning":"Crossbuck","tracks":"0"},{"id":"074676M","mp":"15.140","street":"I-80","city":"OMAHA","county":"DOUGLAS","lat":"41.2316620","lng":"-95.910936","warning":"Passive","tracks":"1"},{"id":"074670W","mp":"13.520","street":"MO AVE/US 275/92","city":"OMAHA","county":"DOUGLAS","lat":"41.2114500","lng":"-95.926290","warning":"Passive","tracks":"1"},{"id":"073055N","mp":"9.840","street":"CAMP GIFFORD RD","city":"BELLEVUE","county":"SARPY","lat":"41.1750600","lng":"-95.895100","warning":"Gates","tracks":"1"},{"id":"073058J","mp":"7.080","street":"MISSION AVE","city":"BELLEVUE","county":"SARPY","lat":"41.1364500","lng":"-95.887500","warning":"Passive","tracks":"1"},{"id":"073063F","mp":"5.250","street":"HARLAN LEWIS RD","city":"BELLEVUE","county":"SARPY","lat":"41.1101171","lng":"-95.889877","warning":"Gates","tracks":"1"},{"id":"974187M","mp":"2.767","street":"US 34","city":"BELLEVUE","county":"SARPY","lat":"41.0812814","lng":"-95.917808","warning":"Passive","tracks":"1"},{"id":"073070R","mp":"1.740","street":"US 73 / 75","city":"BELLEVUE","county":"SARPY","lat":"41.0690800","lng":"-95.928000","warning":"Passive","tracks":"1"},{"id":"073071X","mp":"1.730","street":"US 73 / 75","city":"BELLEVUE","county":"SARPY","lat":"41.0690800","lng":"-95.928000","warning":"Passive","tracks":"1"},{"id":"983747R","mp":"1.721","street":"S 8TH ST","city":"BELLEVUE","county":"SARPY","lat":"41.0690224","lng":"-95.9276336","warning":"Passive","tracks":"2"}]},{"name":"Pacific Junction, IA to Creston, IA","subdivision":"BNSF Creston Subdivision","crossings":[{"id":"073083S","mp":".289","street":"ELLISON AVE","city":"PACIFIC JCTN","county":"MILLS","lat":"41.0161370","lng":"-95.804268","warning":"Gates","tracks":"3"},{"id":"073082K","mp":".646","street":"I-29 N","city":"PACIFIC JCTN","county":"MILLS","lat":"41.0162232","lng":"-95.811385","warning":"Passive","tracks":"1"},{"id":"073081D","mp":".660","street":"I-29 S","city":"PACIFIC JCTN","county":"MILLS","lat":"41.0162232","lng":"-95.811385","warning":"Passive","tracks":"1"},{"id":"063195N","mp":".720","street":"HOWARD ST","city":"CRESTON","county":"UNION","lat":"41.0609132","lng":"-94.345495","warning":"Crossbuck","tracks":"0"},{"id":"063196V","mp":".900","street":"ASH ST","city":"CRESTON","county":"UNION","lat":"41.0632580","lng":"-94.346769","warning":"Passive","tracks":"0"},{"id":"974153T","mp":"1.289","street":"190TH ST","city":"PACIFIC JCTN","county":"MILLS","lat":"41.0161770","lng":"-95.8234280","warning":"Passive","tracks":"1"},{"id":"063201P","mp":"393.660","street":"SUMNER ST","city":"CRESTON","county":"UNION","lat":"41.0542216","lng":"-94.372355","warning":"Passive","tracks":"1"},{"id":"063202W","mp":"394.140","street":"PARK ST","city":"CRESTON","county":"UNION","lat":"41.0496880","lng":"-94.379475","warning":"Passive","tracks":"1"},{"id":"095300B","mp":"397.020","street":"CLOVER AVE","city":"CROMWELL","county":"UNION","lat":"41.0458340","lng":"-94.433036","warning":"Passive","tracks":"1"},{"id":"095303W","mp":"398.517","street":"CO RD","city":"CROMWELL","county":"UNION","lat":"41.0455410","lng":"-94.461661","warning":"Passive","tracks":"1"},{"id":"095305K","mp":"399.510","street":"CO RD H33","city":"PRESCOTT","county":"ADAMS","lat":"41.0434490","lng":"-94.480431","warning":"Passive","tracks":"1"},{"id":"095307Y","mp":"401.020","street":"VANILLA AVE","city":"PRESCOTT","county":"ADAMS","lat":"41.0402050","lng":"-94.509170","warning":"Passive","tracks":"1"},{"id":"095309M","mp":"402.030","street":"CO RD N77","city":"PRESCOTT","county":"ADAMS","lat":"41.0386170","lng":"-94.528218","warning":"Passive","tracks":"1"},{"id":"095310G","mp":"403.160","street":"CO RD","city":"PRESCOTT","county":"ADAMS","lat":"41.0388560","lng":"-94.550015","warning":"Passive","tracks":"1"},{"id":"095311N","mp":"405.760","street":"190TH ST","city":"PRESCOTT","county":"ADAMS","lat":"41.0292340","lng":"-94.596899","warning":"Passive","tracks":"1"},{"id":"095312V","mp":"406.580","street":"6TH AVE","city":"PRESCOTT","county":"ADAMS","lat":"41.0228794","lng":"-94.608928","warning":"Gates","tracks":"2"},{"id":"095313C","mp":"408.687","street":"ORANGE AVE","city":"PRESCOTT","county":"ADAMS","lat":"41.0087870","lng":"-94.641997","warning":"Crossbuck","tracks":"2"},{"id":"095315R","mp":"411.250","street":"MULBERRY AVE","city":"CORNING","county":"ADAMS","lat":"41.0027573","lng":"-94.690452","warning":"Crossbuck","tracks":"2"},{"id":"095316X","mp":"411.840","street":"CO RD","city":"CORNING","county":"ADAMS","lat":"40.9991660","lng":"-94.700164","warning":"Passive","tracks":"1"},{"id":"095318L","mp":"413.690","street":"QUINCY ST","city":"CORNING","county":"ADAMS","lat":"40.9874819","lng":"-94.731849","warning":"Passive","tracks":"1"},{"id":"095319T","mp":"414.200","street":"LOOMIS ST","city":"CORNING","county":"ADAMS","lat":"40.9834300","lng":"-94.740825","warning":"Gates","tracks":"1"},{"id":"095320M","mp":"414.760","street":"US HWY 34","city":"CORNING","county":"ADAMS","lat":"40.9794889","lng":"-94.749044","warning":"Passive","tracks":"1"},{"id":"095324P","mp":"417.920","street":"GINGKO AVE","city":"CORNING","county":"ADAMS","lat":"40.9634370","lng":"-94.804908","warning":"Passive","tracks":"1"},{"id":"095325W","mp":"418.940","street":"FIG AVE","city":"CORNING","county":"ADAMS","lat":"40.9622794","lng":"-94.824292","warning":"Crossbuck","tracks":"1"},{"id":"095329Y","mp":"421.660","street":"CHESTNUT AVE","city":"NODAWAY","county":"ADAMS","lat":"40.9482790","lng":"-94.872256","warning":"Crossbuck","tracks":"1"},{"id":"095330T","mp":"422.954","street":"4TH ST","city":"NODAWAY","county":"ADAMS","lat":"40.9394116","lng":"-94.893554","warning":"Gates","tracks":"2"},{"id":"095331A","mp":"423.098","street":"2ND ST","city":"NODAWAY","county":"ADAMS","lat":"40.9384810","lng":"-94.896008","warning":"Gates","tracks":"2"},{"id":"095332G","mp":"424.280","street":"OLD HWY 34","city":"NODAWAY","county":"ADAMS","lat":"40.9301580","lng":"-94.916237","warning":"Passive","tracks":"1"},{"id":"095335C","mp":"426.500","street":"CO RD","city":"VILLISCA","county":"MONTGOMERY","lat":"40.9252170","lng":"-94.956562","warning":"Gates","tracks":"2"},{"id":"095336J","mp":"427.190","street":"S 7TH AVE","city":"VILLISCA","county":"MONTGOMERY","lat":"40.9249070","lng":"-94.971672","warning":"Gates","tracks":"2"},{"id":"095285B","mp":"427.530","street":"3RD AVE","city":"VILLISCA","county":"MONTGOMERY","lat":"40.9254660","lng":"-94.977272","warning":"Passive","tracks":"1"},{"id":"095286H","mp":"427.980","street":"OLD US HWY 71","city":"VILLISCA","county":"MONTGOMERY","lat":"40.9273540","lng":"-94.985444","warning":"Passive","tracks":"1"},{"id":"095287P","mp":"428.110","street":"US HWY 71","city":"VILLISCA","county":"MONTGOMERY","lat":"40.9281675","lng":"-94.987684","warning":"Passive","tracks":"1"},{"id":"095288W","mp":"429.070","street":"CO RD N18","city":"VILLISCA","county":"MONTGOMERY","lat":"40.9342100","lng":"-95.004528","warning":"Passive","tracks":"1"},{"id":"095289D","mp":"429.750","street":"CO RD H46","city":"VILLISCA","county":"MONTGOMERY","lat":"40.9405970","lng":"-95.013841","warning":"Passive","tracks":"1"},{"id":"095290X","mp":"431.510","street":"CO RD","city":"VILLISCA","county":"MONTGOMERY","lat":"40.9565450","lng":"-95.038054","warning":"Passive","tracks":"1"},{"id":"095291E","mp":"432.780","street":"CO RD","city":"STANTON","county":"MONTGOMERY","lat":"40.9634460","lng":"-95.060414","warning":"Passive","tracks":"1"},{"id":"095292L","mp":"433.964","street":"P AVE","city":"STANTON","county":"MONTGOMERY","lat":"40.9727290","lng":"-95.079631","warning":"Passive","tracks":"1"},{"id":"095293T","mp":"435.080","street":"HALLAND AVE","city":"STANTON","county":"MONTGOMERY","lat":"40.9773900","lng":"-95.099060","warning":"Gates","tracks":"1"},{"id":"095294A","mp":"435.300","street":"BROAD ST","city":"STANTON","county":"MONTGOMERY","lat":"40.9777880","lng":"-95.103900","warning":"Passive","tracks":"1"},{"id":"095296N","mp":"436.110","street":"CO RD","city":"STANTON","county":"MONTGOMERY","lat":"40.9808420","lng":"-95.118739","warning":"Passive","tracks":"1"},{"id":"095297V","mp":"437.200","street":"CO RD M59","city":"STANTON","county":"MONTGOMERY","lat":"40.9870770","lng":"-95.137877","warning":"Passive","tracks":"1"},{"id":"095236E","mp":"438.250","street":"L AVE","city":"STANTON","county":"MONTGOMERY","lat":"40.9931450","lng":"-95.156141","warning":"Passive","tracks":"1"},{"id":"095237L","mp":"439.510","street":"CO RD","city":"STANTON","county":"MONTGOMERY","lat":"41.0023420","lng":"-95.177069","warning":"Passive","tracks":"1"},{"id":"095239A","mp":"440.570","street":"CO RD M55","city":"RED OAK","county":"MONTGOMERY","lat":"41.0097980","lng":"-95.194779","warning":"Passive","tracks":"1"},{"id":"095241B","mp":"441.813","street":"BLUEGRASS RD","city":"RED OAK","county":"MONTGOMERY","lat":"41.0066500","lng":"-95.217491","warning":"Passive","tracks":"1"},{"id":"095242H","mp":"442.142","street":"S 8TH ST","city":"RED OAK","county":"MONTGOMERY","lat":"41.0045442","lng":"-95.223171","warning":"Passive","tracks":"1"},{"id":"095243P","mp":"442.320","street":"5TH ST","city":"RED OAK","county":"MONTGOMERY","lat":"41.0031830","lng":"-95.227285","warning":"Passive","tracks":"1"},{"id":"095244W","mp":"442.550","street":"2ND ST","city":"RED OAK","county":"MONTGOMERY","lat":"41.0023190","lng":"-95.230396","warning":"Passive","tracks":"1"},{"id":"095245D","mp":"442.690","street":"US HWY 48","city":"RED OAK","county":"MONTGOMERY","lat":"41.0018609","lng":"-95.232773","warning":"Passive","tracks":"1"},{"id":"095246K","mp":"443.690","street":"CO RD","city":"RED OAK","county":"MONTGOMERY","lat":"41.0028460","lng":"-95.252005","warning":"Passive","tracks":"1"},{"id":"095247S","mp":"445.170","street":"CO RD","city":"RED OAK","county":"MONTGOMERY","lat":"41.0055040","lng":"-95.279911","warning":"Passive","tracks":"1"},{"id":"095248Y","mp":"446.780","street":"CO RD","city":"RED OAK","county":"MONTGOMERY","lat":"41.0141330","lng":"-95.308591","warning":"Passive","tracks":"1"},{"id":"095251G","mp":"448.290","street":"CO RD M33","city":"EMERSON","county":"MONTGOMERY","lat":"41.0112720","lng":"-95.336992","warning":"Passive","tracks":"1"},{"id":"095252N","mp":"449.900","street":"CO RD","city":"EMERSON","county":"MONTGOMERY","lat":"41.0184000","lng":"-95.365983","warning":"Passive","tracks":"1"},{"id":"095254C","mp":"451.520","street":"US HWY 59","city":"EMERSON","county":"MILLS","lat":"41.0166158","lng":"-95.397069","warning":"Passive","tracks":"1"},{"id":"095256R","mp":"451.928","street":"HARRIS ST","city":"EMERSON","county":"MILLS","lat":"41.0154410","lng":"-95.404703","warning":"Gates","tracks":"2"},{"id":"095257X","mp":"452.880","street":"400TH ST","city":"EMERSON","county":"MILLS","lat":"41.0139780","lng":"-95.422655","warning":"Gates","tracks":"2"},{"id":"095258E","mp":"453.920","street":"CO RD M21","city":"EMERSON","county":"MILLS","lat":"41.0180270","lng":"-95.441712","warning":"Passive","tracks":"1"},{"id":"095259L","mp":"454.930","street":"380TH ST","city":"HASTINGS","county":"MILLS","lat":"41.0214630","lng":"-95.460870","warning":"Gates","tracks":"2"},{"id":"095263B","mp":"456.990","street":"INDIAN AVE","city":"HASTINGS","county":"MILLS","lat":"41.0250640","lng":"-95.499177","warning":"Gates","tracks":"2"},{"id":"095265P","mp":"460.810","street":"325TH ST","city":"MALVERN","county":"MILLS","lat":"41.0056490","lng":"-95.566120","warning":"Gates","tracks":"1"},{"id":"095266W","mp":"461.710","street":"MARION ST","city":"MALVERN","county":"MILLS","lat":"41.0096630","lng":"-95.582305","warning":"Passive","tracks":"1"},{"id":"095267D","mp":"461.860","street":"1ST ST","city":"MALVERN","county":"MILLS","lat":"41.0101680","lng":"-95.585085","warning":"Passive","tracks":"1"},{"id":"095268K","mp":"463.150","street":"JABBER RD","city":"MALVERN","county":"MILLS","lat":"41.0155620","lng":"-95.608726","warning":"Passive","tracks":"1"},{"id":"095272A","mp":"464.510","street":"US HWY 34","city":"MALVERN","county":"MILLS","lat":"41.0311444","lng":"-95.624300","warning":"Passive","tracks":"1"},{"id":"095273G","mp":"465.550","street":"287TH ST","city":"MALVERN","county":"MILLS","lat":"41.0375020","lng":"-95.642462","warning":"Passive","tracks":"1"},{"id":"095274N","mp":"467.170","street":"272ND ST","city":"GLENWOOD","county":"MILLS","lat":"41.0489810","lng":"-95.667985","warning":"Passive","tracks":"1"},{"id":"095275V","mp":"467.830","street":"HERSHEY AVE","city":"GLENWOOD","county":"MILLS","lat":"41.0520990","lng":"-95.680382","warning":"Passive","tracks":"1"},{"id":"095276C","mp":"468.150","street":"262ND ST","city":"GLENWOOD","county":"MILLS","lat":"41.0540230","lng":"-95.685356","warning":"Gates","tracks":"2"},{"id":"095277J","mp":"469.441","street":"250TH ST","city":"GLENWOOD","county":"MILLS","lat":"41.0542590","lng":"-95.709212","warning":"Gates","tracks":"2"},{"id":"095278R","mp":"469.660","street":"HERSHEY AVE","city":"GLENWOOD","county":"MILLS","lat":"41.0523570","lng":"-95.712583","warning":"Passive","tracks":"1"},{"id":"095279X","mp":"470.340","street":"US HWY 34","city":"GLENWOOD","county":"MILLS","lat":"41.0472560","lng":"-95.723768","warning":"Passive","tracks":"1"},{"id":"095280S","mp":"470.956","street":"IVES AVE","city":"GLENWOOD","county":"MILLS","lat":"41.0429680","lng":"-95.734127","warning":"Passive","tracks":"1"},{"id":"095281Y","mp":"471.090","street":"LACEY ST","city":"GLENWOOD","county":"MILLS","lat":"41.0419920","lng":"-95.736241","warning":"Passive","tracks":"1"},{"id":"095282F","mp":"471.210","street":"PRIVATE","city":"GLENWOOD","county":"MILLS","lat":"41.0408850","lng":"-95.738081","warning":"Passive","tracks":"2"},{"id":"095283M","mp":"471.460","street":"MAIN ST","city":"GLENWOOD","county":"MILLS","lat":"41.0382930","lng":"-95.741231","warning":"Passive","tracks":"1"},{"id":"095139V","mp":"472.040","street":"US HWY 34","city":"GLENWOOD","county":"MILLS","lat":"41.0309221","lng":"-95.746597","warning":"Passive","tracks":"1"},{"id":"095140P","mp":"473.333","street":"SH IA 978","city":"GLENWOOD","county":"MILLS","lat":"41.0178740","lng":"-95.766138","warning":"Passive","tracks":"1"}]},{"name":"Creston, IA to Ottumwa, IA","subdivision":"BNSF Ottumwa Subdivision","crossings":[{"id":"063200H","mp":"393.385","street":"NEW YORK AVE","city":"CRESTON","county":"UNION","lat":"41.0561710","lng":"-94.367638","warning":"Gates","tracks":"2"},{"id":"063199R","mp":"393.178","street":"ELM ST","city":"CRESTON","county":"UNION","lat":"41.0568750","lng":"-94.363823","warning":"Gates","tracks":"2"},{"id":"063198J","mp":"392.530","street":"CEDAR ST","city":"CRESTON","county":"UNION","lat":"41.0572024","lng":"-94.351588","warning":"Passive","tracks":"1"},{"id":"063197C","mp":"391.769","street":"OSAGE ST","city":"CRESTON","county":"UNION","lat":"41.0581620","lng":"-94.337112","warning":"Passive","tracks":"1"},{"id":"074107G","mp":"390.755","street":"IRIS AVE","city":"CRESTON","county":"UNION","lat":"41.0559770","lng":"-94.318078","warning":"Gates","tracks":"2"},{"id":"074106A","mp":"390.070","street":"US HWY 34","city":"CRESTON","county":"UNION","lat":"41.0501179","lng":"-94.307805","warning":"Passive","tracks":"1"},{"id":"074105T","mp":"389.486","street":"JAGUAR AVE","city":"CRESTON","county":"UNION","lat":"41.0446430","lng":"-94.299052","warning":"Crossbuck","tracks":"2"},{"id":"074101R","mp":"384.000","street":"DOUGLAS ST","city":"AFTON","county":"UNION","lat":"41.0305687","lng":"-94.197584","warning":"Passive","tracks":"1"},{"id":"074100J","mp":"381.960","street":"190TH ST","city":"AFTON","county":"UNION","lat":"41.0268920","lng":"-94.159261","warning":"Passive","tracks":"1"},{"id":"074098K","mp":"380.780","street":"REDWOOD AVE","city":"THAYER","county":"UNION","lat":"41.0213060","lng":"-94.138286","warning":"Passive","tracks":"1"},{"id":"074097D","mp":"378.806","street":"TULIP AVE","city":"THAYER","county":"UNION","lat":"41.0203240","lng":"-94.101023","warning":"Crossbuck","tracks":"2"},{"id":"074095P","mp":"376.387","street":"US HWY 34","city":"THAYER","county":"UNION","lat":"41.0262301","lng":"-94.056661","warning":"Passive","tracks":"1"},{"id":"074094H","mp":"376.051","street":"3RD AVE","city":"THAYER","county":"UNION","lat":"41.0278820","lng":"-94.050504","warning":"Gates","tracks":"2"},{"id":"074093B","mp":"375.920","street":"5TH AVE","city":"THAYER","county":"UNION","lat":"41.0285590","lng":"-94.047963","warning":"Passive","tracks":"1"},{"id":"074091M","mp":"374.064","street":"CLARKE-UNION AVE","city":"MURRAY","county":"CLARKE","lat":"41.0375710","lng":"-94.014527","warning":"Gates","tracks":"2"},{"id":"074089L","mp":"372.949","street":"110TH AVE","city":"MURRAY","county":"CLARKE","lat":"41.0419280","lng":"-93.994443","warning":"Passive","tracks":"1"},{"id":"074087X","mp":"370.969","street":"130TH AVE","city":"MURRAY","county":"CLARKE","lat":"41.0418050","lng":"-93.956453","warning":"Gates","tracks":"2"},{"id":"074086R","mp":"370.818","street":"SHERMAN ST","city":"MURRAY","county":"CLARKE","lat":"41.0419430","lng":"-93.953563","warning":"Gates","tracks":"2"},{"id":"074085J","mp":"370.669","street":"MAPLE ST","city":"MURRAY","county":"CLARKE","lat":"41.0423790","lng":"-93.950752","warning":"Gates","tracks":"2"},{"id":"074081G","mp":"368.763","street":"150TH AVE","city":"MURRAY","county":"CLARKE","lat":"41.0548350","lng":"-93.918183","warning":"Gates","tracks":"2"},{"id":"074079F","mp":"367.584","street":"KENDALL ST","city":"MURRAY","county":"CLARKE","lat":"41.0483450","lng":"-93.898808","warning":"Gates","tracks":"2"},{"id":"074078Y","mp":"367.208","street":"160TH AVE","city":"MURRAY","county":"CLARKE","lat":"41.0446850","lng":"-93.893478","warning":"Crossbuck","tracks":"2"},{"id":"074077S","mp":"366.882","street":"KANSAS ST","city":"MURRAY","county":"CLARKE","lat":"41.0415340","lng":"-93.888880","warning":"Crossbuck","tracks":"2"},{"id":"074076K","mp":"365.507","street":"CO RD 25","city":"MURRAY","county":"CLARKE","lat":"41.0346020","lng":"-93.864831","warning":"Gates","tracks":"2"},{"id":"074075D","mp":"364.404","street":"190TH AVE","city":"OSCEOLA","county":"CLARKE","lat":"41.0281200","lng":"-93.845853","warning":"Gates","tracks":"2"},{"id":"074073P","mp":"362.865","street":"205TH AVE","city":"OSCEOLA","county":"CLARKE","lat":"41.0226730","lng":"-93.817394","warning":"Gates","tracks":"2"},{"id":"074072H","mp":"361.610","street":"I-35","city":"OSCEOLA","county":"CLARKE","lat":"41.0270950","lng":"-93.794468","warning":"Passive","tracks":"1"},{"id":"074071B","mp":"361.300","street":"WARREN AVE","city":"OSCEOLA","county":"CLARKE","lat":"41.0283540","lng":"-93.788711","warning":"Gates","tracks":"2"},{"id":"074070U","mp":"360.774","street":"S RIDGE RD","city":"OSCEOLA","county":"CLARKE","lat":"41.0306120","lng":"-93.779112","warning":"Gates","tracks":"2"},{"id":"074069A","mp":"360.330","street":"LINCOLN ST","city":"OSCEOLA","county":"CLARKE","lat":"41.0338040","lng":"-93.771829","warning":"Passive","tracks":"1"},{"id":"074068T","mp":"360.060","street":"FILLMORE ST","city":"OSCEOLA","county":"CLARKE","lat":"41.0360600","lng":"-93.767511","warning":"Passive","tracks":"1"},{"id":"074046T","mp":"359.941","street":"MAIN ST","city":"OSCEOLA","county":"CLARKE","lat":"41.0370070","lng":"-93.765665","warning":"Gates","tracks":"2"},{"id":"074044E","mp":"359.726","street":"E AYERS ST","city":"OSCEOLA","county":"CLARKE","lat":"41.0387950","lng":"-93.762282","warning":"Gates","tracks":"2"},{"id":"074050H","mp":"359.022","street":"EISENHOWER RD","city":"OSCEOLA","county":"CLARKE","lat":"41.0432180","lng":"-93.750329","warning":"Gates","tracks":"2"},{"id":"074051P","mp":"358.021","street":"CO RD H33","city":"OSCEOLA","county":"CLARKE","lat":"41.0381500","lng":"-93.733222","warning":"Passive","tracks":"1"},{"id":"074052W","mp":"357.235","street":"US HWY 34","city":"OSCEOLA","county":"CLARKE","lat":"41.0306716","lng":"-93.721960","warning":"Passive","tracks":"1"},{"id":"074054K","mp":"356.577","street":"260TH AVE","city":"OSCEOLA","county":"CLARKE","lat":"41.0260270","lng":"-93.711792","warning":"Gates","tracks":"2"},{"id":"074055S","mp":"355.751","street":"270TH AVE","city":"OSCEOLA","county":"CLARKE","lat":"41.0233634","lng":"-93.692793","warning":"Gates","tracks":"1"},{"id":"074067L","mp":"355.507","street":"270TH AVE","city":"OSCEOLA","county":"CLARKE","lat":"41.0173651","lng":"-93.692781","warning":"Gates","tracks":"1"},{"id":"074056Y","mp":"355.489","street":"IDAHO ST","city":"OSCEOLA","county":"CLARKE","lat":"41.0157844","lng":"-93.688167","warning":"Crossbuck","tracks":"1"},{"id":"074057F","mp":"354.696","street":"280TH AVE","city":"OSCEOLA","county":"CLARKE","lat":"41.0234540","lng":"-93.673424","warning":"Crossbuck","tracks":"1"},{"id":"074066E","mp":"354.539","street":"280TH AVE","city":"OSCEOLA","county":"CLARKE","lat":"41.0130584","lng":"-93.673351","warning":"Crossbuck","tracks":"1"},{"id":"074058M","mp":"353.880","street":"288th AVE","city":"WOODBURN","county":"CLARKE","lat":"41.0108893","lng":"-93.658053","warning":"Passive","tracks":"1"},{"id":"074065X","mp":"353.772","street":"288TH ST","city":"WOODBURN","county":"CLARKE","lat":"41.0230080","lng":"-93.658130","warning":"Passive","tracks":"1"},{"id":"074059U","mp":"352.632","street":"300TH AVE","city":"WOODBURN","county":"CLARKE","lat":"41.0076978","lng":"-93.636987","warning":"Passive","tracks":"1"},{"id":"074064R","mp":"352.466","street":"300TH AVE","city":"WOODBURN","county":"CLARKE","lat":"41.0179440","lng":"-93.633154","warning":"Gates","tracks":"1"},{"id":"074060N","mp":"350.658","street":"GRIFFITH ST","city":"WOODBURN","county":"CLARKE","lat":"41.0112660","lng":"-93.601494","warning":"Gates","tracks":"2"},{"id":"074061V","mp":"350.336","street":"MILL ST","city":"WOODBURN","county":"CLARKE","lat":"41.0099980","lng":"-93.595370","warning":"Gates","tracks":"2"},{"id":"079087P","mp":"349.271","street":"IDAHO LN","city":"WOODBURN","county":"CLARKE","lat":"41.0060050","lng":"-93.576067","warning":"Crossbuck","tracks":"2"},{"id":"079091E","mp":"346.949","street":"CO RD","city":"LUCAS","county":"LUCAS","lat":"41.0180120","lng":"-93.528250","warning":"Crossbuck","tracks":"2"},{"id":"079092L","mp":"346.452","street":"CO RD","city":"LUCAS","county":"LUCAS","lat":"41.0157729","lng":"-93.537570","warning":"Crossbuck","tracks":"2"},{"id":"079093T","mp":"345.939","street":"120TH AVE","city":"LUCAS","county":"LUCAS","lat":"41.0196420","lng":"-93.518390","warning":"Gates","tracks":"2"},{"id":"079094A","mp":"345.172","street":"CO RD","city":"LUCAS","county":"LUCAS","lat":"41.0220240","lng":"-93.504109","warning":"Crossbuck","tracks":"2"},{"id":"079095G","mp":"343.881","street":"CO RD","city":"LUCAS","county":"LUCAS","lat":"41.0266610","lng":"-93.479376","warning":"Passive","tracks":"1"},{"id":"079097V","mp":"343.293","street":"US HWY 34  65","city":"LUCAS","county":"LUCAS","lat":"41.0276973","lng":"-93.468904","warning":"Passive","tracks":"1"},{"id":"095185W","mp":"342.871","street":"DIVISION ST","city":"LUCAS","county":"LUCAS","lat":"41.0280010","lng":"-93.461004","warning":"Gates","tracks":"2"},{"id":"079099J","mp":"341.845","street":"160TH AVE","city":"LUCAS","county":"LUCAS","lat":"41.0320967","lng":"-93.441928","warning":"Gates","tracks":"2"},{"id":"079086H","mp":"337.712","street":"200TH AVE","city":"LUCAS","county":"LUCAS","lat":"41.0408630","lng":"-93.365769","warning":"Passive","tracks":"1"},{"id":"079101H","mp":"336.078","street":"COUNTY ROAD H30","city":"CHARITON","county":"LUCAS","lat":"41.0339660","lng":"-93.337069","warning":"Gates","tracks":"2"},{"id":"079103W","mp":"335.329","street":"CURTIS AVE","city":"CHARITON","county":"LUCAS","lat":"41.0271610","lng":"-93.325838","warning":"Gates","tracks":"2"},{"id":"079104D","mp":"334.347","street":"AUBURN AVE","city":"CHARITON","county":"LUCAS","lat":"41.0181580","lng":"-93.311209","warning":"Gates","tracks":"2"},{"id":"079106S","mp":"334.146","street":"BRADEN AVE","city":"CHARITON","county":"LUCAS","lat":"41.0155910","lng":"-93.309812","warning":"Gates","tracks":"2"},{"id":"079107Y","mp":"334.070","street":"COURT AVE","city":"CHARITON","county":"LUCAS","lat":"41.0144460","lng":"-93.309800","warning":"Passive","tracks":"1"},{"id":"079108F","mp":"333.988","street":"LINDEN ST","city":"CHARITON","county":"LUCAS","lat":"41.0133230","lng":"-93.309609","warning":"Gates","tracks":"2"},{"id":"079110G","mp":"333.770","street":"S MAIN ST","city":"CHARITON","county":"LUCAS","lat":"41.0105123","lng":"-93.307477","warning":"Passive","tracks":"1"},{"id":"079112V","mp":"333.600","street":"8TH ST","city":"CHARITON","county":"LUCAS","lat":"41.0086620","lng":"-93.305369","warning":"Gates","tracks":"2"},{"id":"079114J","mp":"333.150","street":"US HWY 34","city":"CHARITON","county":"LUCAS","lat":"41.0047086","lng":"-93.300923","warning":"Passive","tracks":"1"},{"id":"079115R","mp":"333.059","street":"NORTHWESTERN AVE","city":"CHARITON","county":"LUCAS","lat":"41.0027177","lng":"-93.298682","warning":"Gates","tracks":"2"},{"id":"079117E","mp":"331.421","street":"CO RD H40","city":"CHARITON","county":"LUCAS","lat":"40.9855330","lng":"-93.277102","warning":"Gates","tracks":"2"},{"id":"079119T","mp":"330.420","street":"255TH AVE","city":"RUSSELL","county":"LUCAS","lat":"40.9788580","lng":"-93.260148","warning":"Gates","tracks":"2"},{"id":"079120M","mp":"329.874","street":"WATER TOWER RD","city":"RUSSELL","county":"LUCAS","lat":"40.9756520","lng":"-93.250584","warning":"Gates","tracks":"2"},{"id":"079121U","mp":"328.837","street":"270TH AVE","city":"RUSSELL","county":"LUCAS","lat":"40.9734660","lng":"-93.231758","warning":"Gates","tracks":"2"},{"id":"079122B","mp":"328.257","street":"CO RD H40","city":"RUSSELL","county":"LUCAS","lat":"40.9771090","lng":"-93.221727","warning":"Gates","tracks":"2"},{"id":"079123H","mp":"327.725","street":"CO RD S50","city":"RUSSELL","county":"LUCAS","lat":"40.9804490","lng":"-93.212553","warning":"Gates","tracks":"2"},{"id":"079126D","mp":"326.911","street":"PRAIRIE ST","city":"RUSSELL","county":"LUCAS","lat":"40.9847392","lng":"-93.198138","warning":"Gates","tracks":"2"},{"id":"079129Y","mp":"326.795","street":"HIGHLAND ST","city":"RUSSELL","county":"LUCAS","lat":"40.9850340","lng":"-93.195957","warning":"Gates","tracks":"2"},{"id":"079130T","mp":"325.663","street":"300TH AVE","city":"RUSSELL","county":"LUCAS","lat":"40.9868580","lng":"-93.174371","warning":"Gates","tracks":"2"},{"id":"079132G","mp":"322.880","street":"CO RD","city":"RUSSELL","county":"LUCAS","lat":"40.9830940","lng":"-93.122205","warning":"Crossbuck","tracks":"2"},{"id":"079133N","mp":"321.662","street":"CO RD H40","city":"MELROSE","county":"LUCAS","lat":"40.9771750","lng":"-93.103061","warning":"Gates","tracks":"2"},{"id":"079137R","mp":"319.836","street":"CO RD S63","city":"MELROSE","county":"MONROE","lat":"40.9740500","lng":"-93.069648","warning":"Gates","tracks":"2"},{"id":"079089D","mp":"318.767","street":"TRALEES ST","city":"MELROSE","county":"MONROE","lat":"40.9743750","lng":"-93.049426","warning":"Gates","tracks":"2"},{"id":"079080S","mp":"314.364","street":"CO RD T13","city":"MELROSE","county":"MONROE","lat":"40.9721500","lng":"-92.973756","warning":"Gates","tracks":"2"},{"id":"095151C","mp":"312.694","street":"CO RD T19","city":"MELROSE","county":"MONROE","lat":"40.9786640","lng":"-92.944396","warning":"Gates","tracks":"2"},{"id":"079071T","mp":"309.099","street":"US HWY","city":"ALBIA","county":"MONROE","lat":"41.0111639","lng":"-92.895118","warning":"Passive","tracks":"1"},{"id":"928131V","mp":"307.393","street":"625TH ave","city":"ALBIA","county":"MONROE","lat":"41.0350490","lng":"-92.860033","warning":"Passive","tracks":"1"},{"id":"079151L","mp":"306.605","street":"625TH AVE","city":"ALBIA","county":"MONROE","lat":"41.0344801","lng":"-92.859195","warning":"Passive","tracks":"1"},{"id":"079065P","mp":"305.221","street":"196TH ST","city":"ALBIA","county":"MONROE","lat":"41.0229610","lng":"-92.820900","warning":"Passive","tracks":"1"},{"id":"063229F","mp":"304.525","street":"S CLINTON ST","city":"ALBIA","county":"MONROE","lat":"41.0200180","lng":"-92.808637","warning":"Passive","tracks":"1"},{"id":"063228Y","mp":"304.481","street":"IOWA 5","city":"ALBIA","county":"MONROE","lat":"41.0195816","lng":"-92.807629","warning":"Passive","tracks":"1"},{"id":"063219A","mp":"304.068","street":"D - ST","city":"ALBIA","county":"MONROE","lat":"41.0295290","lng":"-92.813183","warning":"Gates","tracks":"2"},{"id":"063220U","mp":"303.730","street":"MAIN ST","city":"ALBIA","county":"MONROE","lat":"41.0314744","lng":"-92.807151","warning":"Passive","tracks":"1"},{"id":"063227S","mp":"303.605","street":"4TH AVE E","city":"ALBIA","county":"MONROE","lat":"41.0230160","lng":"-92.792529","warning":"Gates","tracks":"1"},{"id":"063226K","mp":"303.555","street":"S 13TH ST","city":"ALBIA","county":"MONROE","lat":"41.02238","lng":"-92.793071","warning":"Gates","tracks":"1"},{"id":"063221B","mp":"303.550","street":"3RD ST","city":"ALBIA","county":"MONROE","lat":"41.0322140","lng":"-92.804683","warning":"Gates","tracks":"1"},{"id":"063224W","mp":"303.257","street":"EAST BENTON AVE","city":"ALBIA","county":"MONROE","lat":"41.0271000","lng":"-92.791110","warning":"Gates","tracks":"1"},{"id":"063225D","mp":"303.150","street":"N 8TH ST","city":"ALBIA","county":"MONROE","lat":"41.0341700","lng":"-92.798150","warning":"Gates","tracks":"1"},{"id":"079061M","mp":"302.444","street":"180TH ST","city":"ALBIA","county":"MONROE","lat":"41.0368979","lng":"-92.783294","warning":"Gates","tracks":"1"},{"id":"079393G","mp":"301.989","street":"667 AVE","city":"ALBIA","county":"MONROE","lat":"41.0408520","lng":"-92.776351","warning":"Crossbuck","tracks":"2"},{"id":"079394N","mp":"301.580","street":"672 AVE","city":"ALBIA","county":"MONROE","lat":"41.0436550","lng":"-92.769502","warning":"Crossbuck","tracks":"2"},{"id":"079395V","mp":"300.872","street":"677 AVE","city":"ALBIA","county":"MONROE","lat":"41.0507410","lng":"-92.759537","warning":"Crossbuck","tracks":"2"},{"id":"079139E","mp":"300.050","street":"CO RD H27","city":"ALBIA","county":"MONROE","lat":"41.0593760","lng":"-92.747290","warning":"Passive","tracks":"1"},{"id":"079140Y","mp":"299.886","street":"685TH AVE","city":"ALBIA","county":"MONROE","lat":"41.0607790","lng":"-92.745243","warning":"Crossbuck","tracks":"1"},{"id":"079142M","mp":"299.110","street":"695TH AVE","city":"ALBIA","county":"MONROE","lat":"41.0674170","lng":"-92.735561","warning":"Passive","tracks":"1"},{"id":"079400P","mp":"298.877","street":"695TH AVE","city":"ALBIA","county":"MONROE","lat":"41.0619855","lng":"-92.725900","warning":"Gates","tracks":"1"},{"id":"079143U","mp":"298.407","street":"700 AVE","city":"ALBIA","county":"MONROE","lat":"41.0748190","lng":"-92.726840","warning":"Gates","tracks":"1"},{"id":"079402D","mp":"298.200","street":"165TH ST","city":"ALBIA","county":"MONROE","lat":"41.0632632","lng":"-92.713088","warning":"Gates","tracks":"1"},{"id":"079405Y","mp":"295.646","street":"720TH AVE","city":"ALBIA","county":"MONROE","lat":"41.0883863","lng":"-92.678230","warning":"Crossbuck","tracks":"1"},{"id":"079145H","mp":"295.615","street":"CO RD T55","city":"ALBIA","county":"MONROE","lat":"41.0899400","lng":"-92.678232","warning":"Gates","tracks":"1"},{"id":"079408U","mp":"293.600","street":"CO RD T59 / T61","city":"CHILLICOTHE","county":"WAPELLO","lat":"41.0921750","lng":"-92.639959","warning":"Gates","tracks":"2"},{"id":"079411C","mp":"291.071","street":"CO RD 225","city":"CHILLICOTHE","county":"WAPELLO","lat":"41.0884380","lng":"-92.592144","warning":"Gates","tracks":"2"},{"id":"095163W","mp":"289.002","street":"POWER PLANT RD","city":"CHILLICOTHE","county":"WAPELLO","lat":"41.0903360","lng":"-92.555659","warning":"Passive","tracks":"1"},{"id":"079416L","mp":"287.393","street":"ELM ST","city":"CHILLICOTHE","county":"WAPELLO","lat":"41.0864570","lng":"-92.527115","warning":"Gates","tracks":"2"},{"id":"062964X","mp":"280.495","street":"S CLAY ST","city":"OTTUMWA","county":"WAPELLO","lat":"41.0258940","lng":"-92.424760","warning":"Gates","tracks":"2"},{"id":"983780R","mp":"280.493","street":"S CLAY ST","city":"OTTUMWA","county":"WAPELLO","lat":"41.0257818","lng":"-92.4249143","warning":"Crossbuck","tracks":"0"},{"id":"062965E","mp":"280.233","street":"MCLEAN ST","city":"OTTUMWA","county":"WAPELLO","lat":"41.0231510","lng":"-92.421242","warning":"Gates","tracks":"2"}]}];

const WARN_COLORS = {
  Gates: "#4adf80",
  Lights: "#f5c060",
  Crossbuck: "#e8d5a0",
  "Stop Sign": "#e05040",
  Passive: "#6a5020",
};

const WARN_ICONS = {
  Gates: "\u2716",
  Lights: "\u26A0",
  Crossbuck: "\u2020",
  "Stop Sign": "\u2B22",
  Passive: "\u25CB",
};

export default function AmtrakCrossings() {
  const [expandedSeg, setExpandedSeg] = useState(null);
  const [filter, setFilter] = useState("");
  const [warnFilter, setWarnFilter] = useState("All");

  const totalCrossings = useMemo(
    () => CROSSING_DATA.reduce((sum, s) => sum + s.crossings.length, 0),
    []
  );

  const warnTypes = ["All", "Gates", "Lights", "Crossbuck", "Stop Sign", "Passive"];

  const filteredSegments = useMemo(() => {
    return CROSSING_DATA.map((seg) => ({
      ...seg,
      crossings: seg.crossings.filter((c) => {
        const matchText =
          !filter ||
          c.street.toLowerCase().includes(filter.toLowerCase()) ||
          c.city.toLowerCase().includes(filter.toLowerCase()) ||
          c.id.toLowerCase().includes(filter.toLowerCase());
        const matchWarn = warnFilter === "All" || c.warning === warnFilter;
        return matchText && matchWarn;
      }),
    }));
  }, [filter, warnFilter]);

  const filteredTotal = filteredSegments.reduce(
    (sum, s) => sum + s.crossings.length,
    0
  );

  return (
    <div
      style={{
        background: "#0f0c08",
        minHeight: "100vh",
        color: "#e8d5a0",
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: "12px",
        maxWidth: 900,
        margin: "0 auto",
      }}
    >
      <div style={{ textAlign: "center", padding: "16px 0 8px" }}>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "#f5c060",
            letterSpacing: 1,
            margin: 0,
          }}
        >
          Amtrak California Zephyr
        </h1>
        <h2
          style={{
            fontSize: 15,
            fontWeight: 400,
            color: "#8a7040",
            margin: "4px 0 0",
          }}
        >
          Railroad Crossings: LNK &rarr; OMA &rarr; CRN &rarr; OSC &rarr; OTM
        </h2>
        <div
          style={{
            fontSize: 13,
            color: "#6a5020",
            marginTop: 6,
          }}
        >
          {totalCrossings} grade crossings &middot; Source: FRA Crossing
          Inventory
        </div>
      </div>

      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: 8,
          margin: "12px 0",
          flexWrap: "wrap",
        }}
      >
        <input
          type="text"
          placeholder="Search street, city, or DOT ID..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            flex: 1,
            minWidth: 180,
            padding: "8px 12px",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid #2a1a08",
            borderRadius: 8,
            color: "#e8d5a0",
            fontSize: 14,
            outline: "none",
          }}
        />
        <select
          value={warnFilter}
          onChange={(e) => setWarnFilter(e.target.value)}
          style={{
            padding: "8px 12px",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid #2a1a08",
            borderRadius: 8,
            color: "#e8d5a0",
            fontSize: 14,
          }}
        >
          {warnTypes.map((w) => (
            <option key={w} value={w}>
              {w === "All" ? "All Warnings" : w}
            </option>
          ))}
        </select>
      </div>

      {(filter || warnFilter !== "All") && (
        <div style={{ fontSize: 13, color: "#6a5020", marginBottom: 8 }}>
          Showing {filteredTotal} of {totalCrossings} crossings
        </div>
      )}

      {/* Legend */}
      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          margin: "8px 0 16px",
          fontSize: 12,
          color: "#8a7040",
        }}
      >
        {Object.entries(WARN_COLORS).map(([type, color]) => (
          <span key={type} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: color,
                display: "inline-block",
              }}
            />
            {type}
          </span>
        ))}
      </div>

      {/* Segments */}
      {filteredSegments.map((seg, si) => (
        <div
          key={si}
          style={{
            marginBottom: 12,
            border: "1px solid #2a1a08",
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          <button
            onClick={() => setExpandedSeg(expandedSeg === si ? null : si)}
            style={{
              width: "100%",
              padding: "12px 16px",
              background:
                expandedSeg === si
                  ? "rgba(200,100,0,0.15)"
                  : "rgba(20,14,4,0.8)",
              border: "none",
              color: "#e8d5a0",
              fontSize: 15,
              fontWeight: 600,
              textAlign: "left",
              cursor: "pointer",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div>{seg.name}</div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 400,
                  color: "#6a5020",
                  marginTop: 2,
                }}
              >
                {seg.subdivision}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  background: "rgba(245,192,96,0.15)",
                  color: "#f5c060",
                  padding: "2px 10px",
                  borderRadius: 12,
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                {seg.crossings.length}
              </span>
              <span
                style={{
                  fontSize: 18,
                  color: "#6a5020",
                  transform:
                    expandedSeg === si ? "rotate(180deg)" : "rotate(0)",
                  transition: "transform 0.2s",
                }}
              >
                &#9660;
              </span>
            </div>
          </button>

          {expandedSeg === si && (
            <div style={{ maxHeight: "70vh", overflowY: "auto" }}>
              {/* Group by city */}
              {groupByCity(seg.crossings).map(([city, crossings]) => (
                <div key={city}>
                  <div
                    style={{
                      padding: "6px 16px",
                      background: "rgba(200,100,0,0.08)",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#f5a020",
                      borderTop: "1px solid #1a1005",
                      position: "sticky",
                      top: 0,
                      zIndex: 1,
                    }}
                  >
                    {city}, {crossings[0].county} County &mdash;{" "}
                    {crossings.length} crossing
                    {crossings.length !== 1 ? "s" : ""}
                  </div>
                  {crossings.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        padding: "8px 16px",
                        borderTop: "1px solid rgba(42,26,8,0.5)",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        fontSize: 13,
                      }}
                    >
                      <span
                        title={c.warning}
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: "50%",
                          background: `${WARN_COLORS[c.warning]}22`,
                          border: `1px solid ${WARN_COLORS[c.warning]}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 11,
                          color: WARN_COLORS[c.warning],
                          flexShrink: 0,
                        }}
                      >
                        {WARN_ICONS[c.warning]}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 600,
                            color: "#e8d5a0",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {c.street}
                        </div>
                        <div style={{ color: "#6a5020", fontSize: 11 }}>
                          DOT# {c.id} &middot; MP {c.mp} &middot;{" "}
                          {c.tracks} track{c.tracks !== "1" ? "s" : ""}
                        </div>
                      </div>
                      <a
                        href={`https://www.google.com/maps?q=${c.lat},${c.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: "#f5a020",
                          textDecoration: "none",
                          fontSize: 16,
                          flexShrink: 0,
                          padding: "4px 8px",
                        }}
                        title="View on Google Maps"
                      >
                        &#x1F4CD;
                      </a>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      <div
        style={{
          textAlign: "center",
          padding: "20px 0",
          fontSize: 11,
          color: "#4a3010",
        }}
      >
        Data: FRA National Highway-Rail Crossing Inventory
        <br />
        via data.transportation.gov &middot; Public at-grade crossings only
      </div>
    </div>
  );
}

function groupByCity(crossings) {
  const groups = {};
  const order = [];
  for (const c of crossings) {
    if (!groups[c.city]) {
      groups[c.city] = [];
      order.push(c.city);
    }
    groups[c.city].push(c);
  }
  return order.map((city) => [city, groups[city]]);
}
