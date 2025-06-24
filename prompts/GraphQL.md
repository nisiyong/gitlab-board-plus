```
https://{{your-gitlab-url}}/api/graphql
```


# 获取 Assignee 列表

## 请求体

```json
[
  {
    "operationName": "searchUsers",
    "variables": {
      "isProject": true,
      "fullPath": "{{group}}/{{project}}",
      "search": ""
    },
    "query": "query searchUsers($fullPath: ID!, $search: String, $isProject: Boolean = false) {\n  group(fullPath: $fullPath) @skip(if: $isProject) {\n    id\n    groupMembers(\n      search: $search\n      relations: [DIRECT, INHERITED, SHARED_FROM_GROUPS]\n    ) {\n      nodes {\n        id\n        user {\n          ...User\n          __typename\n        }\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n  project(fullPath: $fullPath) @include(if: $isProject) {\n    id\n    projectMembers(search: $search, relations: [DIRECT, INHERITED, INVITED_GROUPS]) {\n      nodes {\n        id\n        user {\n          ...User\n          __typename\n        }\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}\n\nfragment User on User {\n  id\n  avatarUrl\n  name\n  username\n  __typename\n}\n"
  }
]
```

## 响应体

```json
[
    {
        "data": {
            "project": {
                "id": "gid://gitlab/Project/{{project-id}}",
                "projectMembers": {
                    "nodes": [
                        {
                            "id": "gid://gitlab/ProjectMember/{{project-member-id}}",
                            "user": {
                                "id": "gid://gitlab/User/{{user-id}}",
                                "avatarUrl": "{{user-avatar-url}}",
                                "name": "{{user-nickname}}",
                                "username": "{{user-username}}",
                                "__typename": "UserCore"
                            },
                            "__typename": "ProjectMember"
                        }
                    ],
                    "__typename": "MemberInterfaceConnection"
                },
                "__typename": "Project"
            }
        }
    }
]
```