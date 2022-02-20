# Config file

Config file contains all sever-side configuration parameters. Default name of
the file is `server-config.json` and is located in the root process directory.
Another name and configuration location can be specified using [`config-file`
command line argument](./command-line-arguments.md#config-file).

|  Property | Type | Default | Description |
|  --- | --- | --- | --- |
|  compressResponse | boolean | `true` | Use the compression middleware package to enable gzip compression of responses. For high-traffic websites in production, it is strongly recommended to offload compression from the application server typically in a reverse proxy (e.g., Nginx). In that case, you should not use compression middleware. |
|  port | number | `3001` | Port to listen on. Overridden by the --port command line setting. |
|  initPaths | string\[\] | `[]` | List of directories where init (catalog) files will be sought, before defaulting to wwwroot/init. This helps with managing catalog files separately from the main codebase. |
|  share? | [ShareConfigDto](#shareconfigdto-class) |  | _(Optional)_ Configuration for the share service. If not defined share service will be disabled. |
|  feedback? | [FeedbackConfigDto](#feedbackconfigdto-class) |  | _(Optional)_ Configuration for the feedback service. If not defined feedback service will be disabled. |
|  proxy | [ProxyConfigDto](#proxyconfigdto-class) |  | Configuration for the proxy service. |
|  trustProxy | boolean \| string \| string\[\] \| number | `false` | The value of the Express "trust proxy" application setting. Set this to true if you want to provide publicly usable URLs behind a reverse proxy For more details read [express behind proxies](http://expressjs.com/en/guide/behind-proxies.html) and [Trust proxy options](http://expressjs.com/en/api.html#trust.proxy.options.table) |
|  serveStatic | [ServeStaticDto](#servestaticdto-class) |  | Configuration for serving static files.|

## ShareConfigDto class

**Properties**

|  Property | Type | Default | Description |
|  --- | --- | --- | --- |
|  newPrefix | string |  | Which service (of those defined in [ShareConfigDto.availablePrefixes](#available-prefixes)<!-- -->) should be used when new URLs are requested. |
|  maxRequestSize | number | 200 | Max payload size for share in kb. |
|  <a id="available-prefixes"></a>availablePrefixes? | ([ShareGistDto](#sharegistdto-class) \| [ShareS3Dto](#shares3dto-class))\[\] |  | List of available configurations for share urls. |

### ShareGistDto class

Share configuration that uses gist service for storing share data.

**Properties**

|  Property | Type | Default | Description |
|  --- | --- | --- | --- |
|  service | 'gist' | `'gist'` | Identification of the service to be used. |
|  prefix | string |  | Prefix for this service. |
|  apiUrl | string | `https://api.github.com/gists` | Url of gist api. |
|  accessToken | string |  | _(Optional)_ Github access token with access to create gist. |
|  userAgent | string | `TerriaJS-Server` | User agent HTTP Header to set |
|  fileName | string | `usercatalog.json` | The filename to give to the gist file |
|  description | string | `User-created catalog` | The description attached to each Gist |

### ShareS3Dto class

**Properties**

|  Property | Type | Default | Description |
|  --- | --- | --- | --- |
|  service | 's3' | `'s3'` | Identification of the service to be used. |
|  prefix | string |  | Prefix for this service. |
|  region | string |  | The AWS region |
|  bucket | string |  | An existing S3 bucket in which to store objects |
|  credentials? | `{ accessKeyId: string; secretAccessKey: string; }` |  | _(Optional)_ Credentials of a user with S3 getObject and putObject permission on the above bucket. If not provided here, you must ensure they're available as environment variables or in a shared credentials file. See [node configuring aws guide](http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-configuring.html)<!-- -->. |
|  keyLength | number | 54 | The length of the random share key to generate (not including prefix), up to 54 characters. Defaults to the full length. |

## FeedbackConfigDto class

**Properties**

|  Property | Type | Default | Description |
|  --- | --- | --- | --- |
|  primaryId? | string |  | _(Optional)_ Which service of those defined in the options will be used when sending new feedback. |
|  options? | ([GithubFeedbackDto](#githubfeedbackdto-class) \| [MailFeedbackDto](#mailfeedbackdto-class) \| [RedmineFeedbackDto](#redminefeedbackdto-class))\[\] |  | _(Optional)_ List of available feedback services. |

### GithubFeedbackDto class

**Properties**

|  Property | Type | Default | Description |
|  --- | --- | --- | --- |
|  service | 'github' | `'github'` | Service to use. |
|  id | string |  | Id of feedback service. |
|  issuesUrl | string |  | Github API issues url. See [Github API create an issue](https://docs.github.com/en/rest/reference/issues#create-an-issue) for details. |
|  accessToken |  string | Github access token with permission to create issue. |  |
|  userAgent | string | `'TerriaJS-Bot'` | Http user agent. |

### MailFeedbackDto class

**Properties**

|  Property | Type | Default | Description |
|  --- | --- | --- | --- |
|  service | 'mail' | `'mail'` | Service to use. |
|  id | string |  | Id of feedback service. |
|  smtpHost | string |  | Hostname or IP address of smtp server to connect to. |
|  smtpPort | number |  | Port of smtp server to connect to. |
|  secure | boolean | `false` | Whether authentication should be done against SMPT server. |
|  auth? | [MailFeedbackAuth](#mailfeedbackauth-class) |  | _(Optional)_ |
|  email | string |  | Email to which feedback will be sent. |
|  additionalParameters? | AdditionalParametersDto\[\] | | _(Optional)_ |

#### MailFeedbackAuth class

**Properties**

|  Property | Type | Default | Description |
|  --- | --- | --- | --- |
|  pass | string |  | Password of the user that will be used to connect to smtpServer. |
|  user | string |  | Name of the user that will be used to connect to smtpServer. |

### RedmineFeedbackDto class

**Properties**

|  Property | Type | Default | Description |
|  --- | --- | --- | --- |
|  service | 'redmine' | 'redmine' | Service to use. |
|  id | string | Id of feedback service. | Id of feedback service. |
|  project\_id | number |  | Id of redmine project. |
|  issuesUrl | string |  | Redmine API url for creating issue. |
|  username | string |  | Username that will be used for login or redmine and creating new issues. |
|  password | string |  | Password for authenticating on redmine |

## AdditionalParametersDto class

**Properties**

|  Property | Type | Default | Description |
|  --- | --- | --- | --- |
|  descriptiveLabel | string |  |  |
|  name | string |  |  |

## ProxyConfigDto class

**Properties**

|  Property | Type | Default | Description |
|  --- | --- | --- | --- |
|  postSizeLimit| number | 102400 | The largest size, in bytes, of data that the proxy will send in a POST request. |
|  proxyAllDomains | boolean | false | If this setting is true, the allowProxyFor list is ignored, and all requests are accepted. |
|  allowProxyFor | string\[\] | [] | List of domains which the server is willing to proxy for. Subdomains are included automatically. It will be ignored if [ProxyConfigDto.whitelistPath](#proxyconfigdto-whitelistpath) is defined and file exists. |
|  blacklistedAddresses| string\[\] | DEFAULT_BLACKLIST | IP addresses to refuse to proxy for, even if they're resolved from a hostname that we would ordinarily allow. It will be ignored if [ProxyConfigDto.blacklistPath](#proxyconfigdto-blacklistPath) is defined and file exists. |
|  <a id="proxyconfigdto-whitelistpath"></a>whitelistPath? | string |  | _(Optional)_ Location of the file containing the list of domains which the server is willing to proxy for. Subdomains are included automatically. Each domain should be in its own row. |
|  <a id="proxyconfigdto-blacklistPath"></a>blacklistPath? | string |  | _(Optional)_ Location of the file containing the list of IP addresses to refuse to proxy for, even if they're resolved from a hostname that would ordinarily be proxied. Each IP address should be in its own row. If your server has access to an IP range that is not accessible to clients of the proxy, and you want to ensure that the client can't get access to it through the proxy, it is vital that you add that IP range to this list. Any change to file content will be picked up automatically without restarting server. |
|  upstreamProxy? | string |  | _(Optional)_ Pass requests through to another proxy upstream. |
|  bypassUpstreamProxyHosts? | Map&lt;string, boolean&gt; |  | _(Optional)_ |
|  appendParamToQueryString? | Map&lt;string, [AppendParamToQueryStringDto](#appendparamtoquerystringdto-class)<!-- -->\[\]&gt; |  | _(Optional)_ An array of options which you to inform which additional parameters are appended to the url querystring. |
|  proxyAuth? | Record&lt;string, any&gt; |  | _(Optional)_ |

### AppendParamToQueryStringDto class

**Properties**

|  Property | Type | Default | Description |
|  --- | --- | --- | --- |
|  params? | Record&lt;string, string&gt; |  | _(Optional)_ Parameters that should be appended to the request. |
|  regexPattern? | string |  | _(Optional)_ A regex pattern used to test whether parameters should be attached. Set to '.' to match everything. |

## ServeStaticDto class

**Properties**

|  Property  | Type | Default | Description |
|  --- | --- | --- | --- |
|  serveStatic | boolean | `true` | whether to serve static directory of files |
|  resolvePathRelativeToWwwroot | string | `'/index.html'` | The index file served at root. |
|  resolveUnmatchedPathsWithIndexHtml | boolean | `false` | Whether to route unmatched routes to /index.html and let the frontend resolve the route |
