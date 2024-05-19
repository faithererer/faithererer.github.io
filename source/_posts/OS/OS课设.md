---
title: OS_课设
date: 2023-06-18 00:28:12
tags: [操作系统]
mathjax: true
cover: https://vip1.loli.io/2022/05/11/tw4ITGVMAH287jE.jpg
description: 实现模拟文件系统。
categories: OS
---



# 配置VScode




- 安装C/C++扩展

- 安装完成之后，直接在VsCode中按 `ctrl+shift+p`快捷键,选择`C/C++编辑UI`。


![image-20230618182000074](https://blog-faithererer.oss-cn-qingdao.aliyuncs.com/blog/typoraImg202306182006628.png)

![image-20230618171213466](https://blog-faithererer.oss-cn-qingdao.aliyuncs.com/blog/typoraImg202306182035387.png)

![image-20230618171938200](https://blog-faithererer.oss-cn-qingdao.aliyuncs.com/blog/typoraImg202306182006081.png)

- 在目录下新建`output`文件夹，在task.json中划线部分修改为`output`，这样生成的`exe`就会保存至`/output`文件夹下

	![image-20230618182628771](https://blog-faithererer.oss-cn-qingdao.aliyuncs.com/blog/typoraImg202306182006200.png)

我想让程序输出在外部终端，发现C/C++插件现在的版本无法做到这一点，需要回退，而我的vscode TMD无法安装这个插件的历史版本，于是经过搜索知道，在[网页](https://marketplace.visualstudio.com/items?itemName=ms-vscode.cpptools)抓包把版本信息替换为想要的版本 

 ```
 https://marketplace.visualstudio.com/_apis/public/gallery/publishers/ms-vscode/vsextensions/cpptools/1.8.4/vspackage?targetPlatform=win32-x64
 ```

![image-20230618195057503](https://blog-faithererer.oss-cn-qingdao.aliyuncs.com/blog/typoraImg202306182006466.png)

在`lauch.json`中添加`"externalConsole": true`

![image-20230618195230187](https://blog-faithererer.oss-cn-qingdao.aliyuncs.com/blog/typoraImg202306182006392.png)

输出如图：

![image-20230618195535278](https://blog-faithererer.oss-cn-qingdao.aliyuncs.com/blog/typoraImg202306182006298.png)

是的，又出现了中文乱码！！！！而在vscode内部终端则正常，一眼丁真鉴定为，cmd的编码。经过查询，按以下方法可以成功更改编码。

![image-20230618195918187](https://blog-faithererer.oss-cn-qingdao.aliyuncs.com/blog/typoraImg202306182007512.png)

在cmd输入`chcp`返回`Active code page: 65001`说明成功更改为`utf-8`

再次运行：

![image-20230618200530767](https://blog-faithererer.oss-cn-qingdao.aliyuncs.com/blog/typoraImg202306182007626.png)

成功！，虽然字体也变了的说，但是也可以接受吧。。。

不要忘记修改`output`文件夹配置：

![image-20230618202224084](https://blog-faithererer.oss-cn-qingdao.aliyuncs.com/blog/typoraImg202306182035173.png)

![image-20230618202301910](https://blog-faithererer.oss-cn-qingdao.aliyuncs.com/blog/typoraImg202306182035234.png)





# OS文件系统知识梳理

- 定义：文件就是一组有意义的信息/数据的集合
- 属性
	- 文件名 ：同一目录下不允许有重名文件
	- 标识符：具有唯一性，用于区分各个文件的一种内部名称
	- 文件类型
	- 位置：文件存放的路径（用户使用），在外层中的地址（OS使用，对用户透明）
	- 大小
	- 创建时间，上次修改时间
	- 文件所有者信息
	- 保护信息：对文件进行保护的访问控制信息

## 文件内部的组织形式（逻辑结构）

所谓逻辑结构就是站在用户的观点来看，文件内部的数据应该是如何组织起来的

- 无结构文件,如.txt,由一些二进制和字符流组成，又称为流式文件

- 有结构文件，如.csv,sql_table,由一组相似的记录组成，又称记录文件

	根据各条长度是否相等，分为定长记录和可变长记录(常见)

	- 记录是一组相关数据项的集合，和sql的元组很像捏

	- 逻辑结构

		- 顺序文件：记录间在逻辑上顺序排列，记录可定长可变长

			- 又分为串（记录之间的顺序于关键字无关，通常按存放顺序）和顺序结构（记录之间的顺序按关键字顺序排列）

			- 存储

				- 链式存储

				- 顺序存储

					![image-20230619094303733](https://blog-faithererer.oss-cn-qingdao.aliyuncs.com/blog/typoraImg202306191152401.png)

			- 索引文件

				- 对于可变长的记录文件，使用顺序文件的逻辑结构时，访问第i条记录，需要重头遍历，对于此类文件，我们采用索引文件结构。因为索引文件本身是定长记录，因此可以快速找到第i个记录对应的索引项，将索引号作为关键字，可实现顺序结构，支持折半查找。

				| 索引号 | 长度m | 指针ptr |
				| :----: | :---: | ------- |
				|   0    | $m_0$ |         |
				|  ...   |  ...  |         |
				|   i    | $m_i$ |         |

			- 索引顺序文件

				- 每个索引项对应一个记录，可能索引文件会比文件本身大，降低存储空间利用率，因此采用索引文件和顺序文件的折中。
				- 与索引文件区别是，它的索引项指向的是一组记录

			- 多级索引顺序文件

				- 如果文件超大，需要采用，类似二级页表

## 目录

> 目录是一种数据结构，用于标志系统中的文件及其物理位置
>
> 供检索时使用

![image-20230619100732670](https://blog-faithererer.oss-cn-qingdao.aliyuncs.com/blog/typoraImg202306191152291.png)

- 文件控制块(FCB)

	- FCB的有序集合称为文件目录，FCB包括基本信息(文件名，物理地址，逻辑结构，物理结构)，存取控制信息，使用信息。最重要的就是文件名和文件存放的物理地址，可以实现按名存取。

	- 操作

		- 搜索，用户使用文件系统需要根据文件名搜索目录，找到该文件对应的目录项

		- 创建文件，创建一个新文件，需要在其所属的目录中增加一个目录项

		- 删除文件，需要在所属目录删除对应的目录项

		- 显示目录，显示目录的文件和属性

		- 修改目录，某些文件属性保存在目录中，当这些属性变化时需要修改目录

		- 结构

			- 单级目录

				- 实现了按名存取，但是不允许文件重名

			- 两级目录

				- 分为：

					- 主文件目录（MFD）
                        | 列名1 | 列名2 | 列名3 |
                        | ----- | ----- | ----- |
                        | 内容1 | 内容2 | 内容3 |
                        | 内容4 | 内容5 | 内容6 |

						|  MFD  |
						| ----- |
						| User1 |
						|  ...  |

						

					- 用户文件目录（UFD）

						| 文件名 | ..   | 存放位置 |
						| :-----: | ----- | :-----: |
						|   a    |      |   ...    |
						|   b    |      |    ..    |

					两级目录不同用户允许文件重名，也可以实现在目录上实现访问限制

				- 多级目录（树形目录结构）

					- ![image-20230619110407145](https://blog-faithererer.oss-cn-qingdao.aliyuncs.com/blog/typoraImg202306191152388.png)

				- 无环图目录结构

					- ![image-20230619111003269](https://blog-faithererer.oss-cn-qingdao.aliyuncs.com/blog/typoraImg202306191152015.png)

## 应提供的功能

- 创建文件

	- 需要提供

		- 所需外存空间大小(如：一个盘块,1KB)
		- 文件存放路径(D:/Demo)
		- 文件名

		- OS做的事情:
			- 在外存中找到文件所需空间
			- 根据路径信息，找到该目录对应的目录文件
			- 在目录中添加该文件的目录项

- 读文件

	- 需要提供
		- 打开文件表的文件编号
		- 指明读入多少数据
		- 放在内存的位置
	- OS做的事情
		- 将r指针指向的外存中，将用户指定大小的数据读入用户指定的内存区域

- 写文件

	- 需要提供
		- 打开文件表的文件编号
		- 写回多少数据
		- 写会外存的数据放在内存中的位置
	- OS做的事情
		- 从指定的内存中，将用户指定大小的数据写回w指针指向的外存

- 删除文件

	- 需要提供
		- 存放路径
		- 文件名
	- OS做的事情
		- 找到文件名对应的目录项
		- 根据该目录项在外存的位置，文件大小等信息,回收文件占用的磁盘块
		- 删除对应目录项

- 打开文件

	- 需要提供

		- 存放路径
		- 文件名
		- 操作类型（r,rw等）

	- OS做的事情

		- 根据路径找到目录文件

		- 检查用户是否具有指定的操作权限

		- 将目录项复制到内存中的"打开文件表"中，并将对应表目的编号返回给用户，之后用户使用打开文件表的编号来指明要操作的文件。

			![image-20230619113515732](https://blog-faithererer.oss-cn-qingdao.aliyuncs.com/blog/typoraImg202306191152267.png)

- 关闭文件

	- 需要提供
		- 打开文件表
	- OS做的事情
		- 将进程的打开文件表的对应表项删除
		- 回收分配给该文件的内存空间等资源
		- 系统表打开计数器-1，如果为0则删除系统表对应表项。

![image-20230619115042260](https://blog-faithererer.oss-cn-qingdao.aliyuncs.com/blog/typoraImg202306191152802.png)

## 如何存放在外存（物理结构）：

物理结构就是从OS的观点来看，文件的数据如何存放在外存中的

- ![image-20230619091646943](https://blog-faithererer.oss-cn-qingdao.aliyuncs.com/blog/typoraImg202306191152371.png)

其他功能：文件共享，文件保护



# 实现

```cpp
#include<bits/stdc++.h>
using namespace std;

string command;//用户指令

vector<string> path_list;

struct File{//定义文件信息
    string filename;
    int size;
    string content="";
    time_t time;
};

struct User{//定义用户信息
    string user_name;
    string pwd; 
};


struct Dir{ //目录信息
    string dir_name;
    vector<struct File> file;
    vector<struct Dir> dir;
};

struct Dir_Node{//目录联系信息
    struct Dir dir;
    vector<struct Dir_Node*> child;
    struct Dir_Node *parent;
};

struct Thread_Open_File_Table{//进程打开文件列表
    struct File file;
    int permission; //1读，2写，3读写 
    char* p;//读写指针
    int index;//系统索引号
};

struct Sys_Open_File_Table{//系统打开文件列表
    struct File file;
    int permission; //1读，2写，3读写 
    char* p;//读写指针
    int index;//系统索引号
    int count;//引用计数
};


vector<struct User> MFD; //主目录





void Welcome();
void Command_Judge(string command); //判断指令
void Create_User();//创建用户
void Show_User(); //显示用户信息
void Login_In(struct User u); //用户登录判定
void Dir(); ////显示当前目录下的文件信息
void Insert_Node_Dir();
void Cd(string dir_name);
void Cd_Rollback();
void MkDir(string dir_name);
void Os_Open(string filename);
void Os_Read();
void Os_Write();
void Os_Create(string fileName);
void Os_Close();
void showU();
void ShowFileInfo();

struct Dir_Node *pDir_root=new Dir_Node;
struct Dir_Node *pCurDir=pDir_root; //当前目录
vector<struct Sys_Open_File_Table> SOFT; //系统打开文件表
vector<struct Thread_Open_File_Table> TOFT;//进程打开文件表
time_t now_time; //时间戳变量
string Login_In_status="";//登录状态

int main(){
    Welcome();
    pDir_root->dir.dir_name="root";
    pDir_root->parent=nullptr;
    path_list.push_back("root");
    while(1){
        now_time=time(NULL);//实时时间戳

        for(int i=0;i<path_list.size();i++){
            if(i==path_list.size()-1)
                cout<<path_list[i];
            else
                cout<<path_list[i]<<"/";
        }
        if(Login_In_status!="")
            cout<<"("<<Login_In_status<<")";
        cout<<": >>> ";

        cin>>command;
        Command_Judge(command);
    }
}

void Command_Judge(string command){
    if(command=="help"){
        cout<<"dir-----显示当前目录文件"<<endl;
        cout<<"mkdir-----新建目录"<<endl;
        cout<<"cd-----切换到指定目录"<<endl;
        cout<<"cd..-----回退一级目录"<<endl;
        cout<<"del-----删除文件"<<endl;
        cout<<"open-----打开文件"<<endl;
        cout<<"create-----新建文件"<<endl;
        cout<<"read-----读文件"<<endl;
        cout<<"write-----写文件"<<endl;        
        cout<<"close-----关闭文件"<<endl;
        cout<<"create_user-----创建用户"<<endl;
        cout<<"login-----用户登录"<<endl;
        cout<<"showU-----显示用户信息"<<endl;
        cout<<"showF-----显示文件详细信息"<<endl;
        cout<<endl;
    }
    else if(command=="dir"){
        Dir();
        cout<<endl;
    }
    else if(command=="exit"){
        system("pause");
    }
    else if(command=="create_user"){

        Create_User();

        cout<<endl;
    }
    else if(command=="login"){
        struct User u;
        cout<<"输入用户名"<<endl;
        cin>>u.user_name;
        cout<<"输入密码"<<endl;
        cin>>u.pwd;
        Login_In(u);
    }
    else if(command=="cd"){
        string dir_name;
        cin>>dir_name;
        Cd(dir_name);

    }
    else if(command=="cd.."){
        Cd_Rollback();
    }
    else if(command=="mkdir"){
        cout<<"输入新建目录名"<<endl;
        string dir_name;
        cin>>dir_name;
        MkDir(dir_name);
        
    }
    else if(command=="create"){
        string fileName;
        cout<<"输入文件名"<<endl;
        cin>>fileName;
        while(fileName.find("/")!=std::string::npos){
            cout<<"文件名不能包含'/' !!!"<<endl;
            cout<<"输入文件名"<<endl;
            cin>>fileName;
        }
        while(fileName.find(".")==std::string::npos||fileName.find(".")==fileName.size()-1){
            cout<<"文件必须有后缀 !!!"<<endl;
            cout<<"输入文件名"<<endl;
            cin>>fileName;
        }         
       
        Os_Create(fileName);
    }
    else if(command=="open"){

        cout<<"输入文件名"<<endl;
        string fileName;
        cin>>fileName;
        Os_Open(fileName);
    }
    else if(command=="write"){
        Os_Write();
    }
    else if(command=="read"){
        Os_Read();
    }
    else if(command=="showU"){
        showU();
    }
    else if(command=="showF"){
        ShowFileInfo();
    }
    else{
        cout<<"不是命令"<<endl;
        cout<<endl;
    }
    
}

    


void Login_In(struct User u){
    bool flag=false;
    for(int i=0;i<MFD.size();i++){
        if(MFD[i].user_name==u.user_name){
            if(MFD[i].pwd==u.pwd){
                cout<<"登录成功"<<endl;
                Login_In_status=u.user_name;//登录状态改变
                cout<<endl;
                flag=true;
                for(int i=0;i<pCurDir->child.size();i++){
                    if(pCurDir->child[i]->dir.dir_name==u.user_name){
                        pCurDir=pCurDir->child[i];
                        path_list.push_back(u.user_name);
                        break;
                    }
                }
                break;
            }
            else{
                cout<<"密码错误"<<endl;
                cout<<endl;
                flag=true;
                break;
            }

        }
    }
    if(flag==false)
        cout<<"用户名不存在"<<endl;
        cout<<endl;
}


void Dir(){
    for(int i=0;i<pCurDir->child.size();i++){
        cout<<pCurDir->child[i]->dir.dir_name<<endl;
    }
    for(int i=0;i<pCurDir->dir.file.size();i++){
        cout<<pCurDir->dir.file[i].filename<<endl;
    }
}

void Insert_Node_Dir(struct Dir_Node *pcurDir, struct Dir newDir){

    struct Dir_Node *child_node=new Dir_Node;
    child_node->dir=newDir;
    child_node->parent=pcurDir;

    pcurDir->child.push_back(child_node);
}
void Insert_Node_File(struct Dir_Node *pcurDir, struct Dir newDir){

    struct Dir_Node *child_node=new Dir_Node;
    child_node->dir.file=newDir.file;
    child_node->parent=pcurDir;

    pcurDir->child.push_back(child_node);
}

void Create_User(){
    if(pCurDir->parent!=nullptr){
        cout<<"非根目录无法创建用户!!!"<<endl;
        return;
    }
    struct User u;
    cout<<"输入用户名"<<endl;
    cin>>u.user_name;
    cout<<"输入密码"<<endl;
    cin>>u.pwd;   
    for(int i=0;i<MFD.size();i++){
        if(MFD[i].user_name==u.user_name){
            cout<<"用户名已存在"<<endl;
            cout<<endl;
            return;
        }
    }
    MFD.push_back(u);

    struct Dir_Node *dn=new Dir_Node;
    struct Dir d;
    d.dir_name=u.user_name;
    dn->dir=d;
    Insert_Node_Dir(pCurDir, dn->dir);
    cout<<"创建成功!"<<endl;
}

void Cd(string dir_name){
    if(pCurDir->parent==nullptr){//判断是否为根目录
        if(Login_In_status=="no"){//判断是否登录
            cout<<"请先登录"<<endl;
            cout<<endl;
                return;
        }
        else{
            if(Login_In_status==dir_name){//判断是否为当前用户
                for(int i=0;i<pCurDir->child.size();i++){
                    if(pCurDir->child[i]->dir.dir_name==dir_name){
                        pCurDir=pCurDir->child[i];
                        path_list.push_back(dir_name);
                        return;
                    }  
                }
            }
        }
            
    }
    
    bool flag=false;
    for(int i=0;i<pCurDir->child.size();i++){
        if(pCurDir->child[i]->dir.dir_name==dir_name){
            pCurDir=pCurDir->child[i];
            path_list.push_back(dir_name);
            flag=true;
            break;
        }  
    }
    if(flag==false)
        cout<<"目录不存在"<<endl;
        cout<<endl;
}

void Cd_Rollback(){
    if(pCurDir->parent==nullptr)
        cout<<"已经到达最顶级目录！"<<endl;
    else{
        pCurDir=pCurDir->parent;
        path_list.pop_back();
    }
}

void MkDir(string dir_name){
    if(pCurDir->parent==nullptr){
        cout<<"根目录无法创建非用户目录!!!"<<endl;
        return;
    }    
    for(int i=0;i<pCurDir->child.size();i++){
        if(pCurDir->child[i]->dir.dir_name==dir_name){
            cout<<"目录已存在"<<endl;
            cout<<endl;
            return;
        }
    }
    struct Dir_Node *dn=new Dir_Node;
    struct Dir d;
    d.dir_name=dir_name;
    dn->dir=d;
    Insert_Node_Dir(pCurDir, dn->dir);
    cout<<"创建成功"<<endl;
}


void Os_Open(string filename){
    int f=0;
    for(int i=0;i<pCurDir->dir.file.size();i++){
        if(pCurDir->dir.file[i].filename==filename){
            f=1;
            break;
        }
    }
    if(f==0){
        cout<<"文件不存在"<<endl;
        return;
    }
    
    struct Thread_Open_File_Table toft;
    struct Sys_Open_File_Table soft;
    bool flag=false;//标志系统打开文件表是否存在该文件
    cout<<"权限: 1:读   2.写    3.读写"<<endl;
        int s;
        cin>>s;//声明权限
        if(s==1)
            toft.permission=1;
        else if(s==2)
            toft.permission=2;
        else if(s==3)
            toft.permission=3;
        else{
            cout<<"输入错误"<<endl;
            cout<<endl;
            return;
        }
        //在系统打开表中寻找,根据文件名
        for(int i=0;i<SOFT.size();i++){
            if(SOFT[i].file.filename==filename){//存在则计数器加一，并复制到进程的打开文件表中
                soft.file.filename=filename;
                SOFT[i].count++;
                toft.file.filename=filename;
                toft.index=i; //系统打开文件表的编号作为进程打开文件表的索引
                TOFT.push_back(toft);
                flag=true;
                break;
            }
        }
        if(flag==false){//不存在则，加入到系统的打开文件表，并复制到进程的打开文件表中
            soft.file.filename=filename;
            soft.count=1;
            SOFT.push_back(soft);
            toft.file.filename=filename;
            toft.index=SOFT.size()-1;
            TOFT.push_back(toft);
        }
        cout<<"打开成功"<<endl;
}

void Os_Write(){
    string fileName;
    int flag=false;
    int flag2=false;
    cout<<"输入文件名"<<endl;
    cin>>fileName;
    for(int i=0;i<pCurDir->dir.file.size();i++){
        if(pCurDir->dir.file[i].filename==fileName){//寻找目录是否存在该文件名
            flag=true; //存在
            // 查找进程打开文件表是否存在
            for(int j=0;j<TOFT.size();j++){
                if(TOFT[j].file.filename==fileName){
                    flag2=true; //存在
                    if(TOFT[j].permission==2||TOFT[j].permission==3){//判断权限
                        cout<<"输入内容"<<endl;
                        string content;
                        cin>>content;
                        pCurDir->dir.file[i].content=content;
                        pCurDir->dir.file[i].size=content.size();
                        break;
                    }
                    else{
                        cout<<"没有写权限"<<endl;
                        return;
                    }
                }
            }
            if(flag2==false){
                cout<<"文件未打开"<<endl;
                return;
            }
        }
    }
    if(flag==false){
        cout<<"当前目录不存在该文件";
        return;
    }
    cout<<"写入成功"<<endl;
}

void Os_Read(){
    bool flag=false;
    bool flag2=false;
    string fileName;
    cout<<"输入文件名"<<endl;
    cin>>fileName;
    for(int i=0;i<pCurDir->dir.file.size();i++){
        if(pCurDir->dir.file[i].filename==fileName){//判断当前目录是否存在该文件
            flag=true;
            for(int j=0;j<TOFT.size();j++){
                if(TOFT[j].file.filename==fileName){//判断进程打开文件表是否存在该文件
                    flag2=true;
                    if(TOFT[j].permission==1||TOFT[j].permission==3){//判断权限
                        cout<<pCurDir->dir.file[i].content<<endl;
                        break;
                    }
                    else{
                        cout<<"没有读权限"<<endl;
                        return;
                    }
                }
            }
            if(flag2==false){
                cout<<"文件未打开"<<endl;
                return;
            }
        }
    }
    
    if(flag==false){
        cout<<"当前目录不存在该文件"<<endl;
        return;
    }
}

void Os_Del(string filename){
    int flag=false;
    for(int i=0;i<pCurDir->dir.file.size();i++){
        if(pCurDir->dir.file[i].filename==filename){
            flag=true;
            pCurDir->dir.file.erase(pCurDir->dir.file.begin()+i);
            break;
        }
    }
    if(flag==false){
        cout<<"当前目录不存在该文件"<<endl;
        return;
    }
    cout<<"删除成功"<<endl;
}

void Os_Create(string fileName){
    for(int i=0;i<pCurDir->dir.file.size();i++){
        if(pCurDir->dir.file[i].filename==fileName){
            cout<<"当前目录已存在该文件，无法继续创建"<<endl;
            return;
        }
    }        
    struct File file;
    file.filename=fileName;
    file.size=file.content.size();
    file.time=now_time;
    pCurDir->dir.file.push_back(file);
    cout<<"创建成功"<<endl;
}

void Show_User(){
    for(int i=0;i<MFD.size();i++){
        cout<<MFD[i].user_name<<endl;
    }
}

void showU(){

    cout<<"-------------------------------------------------------------------"<<endl;
    cout<<"用户名"<<"\t"<<endl;
    for(int i=0;i<MFD.size();i++){
        cout<<MFD[i].user_name<<endl;
    }
    cout<<"-------------------------------------------------------------------"<<endl;

}

void Os_Close(){
    string filename;
    cout<<"输入文件名"<<endl;
    for(int i=0;i<TOFT.size();i++){
        if(TOFT[i].file.filename==filename){
            SOFT[TOFT[i].index].count--;
            if(SOFT[TOFT[i].index].count==0)
                SOFT.erase(SOFT.begin()+TOFT[i].index);
            TOFT.erase(TOFT.begin()+i);
            cout<<"关闭成功"<<endl;
            return;
        }
    }
}

void ShowFileInfo(){
    cout<<"-------------------------------------------------------------------"<<endl;
    cout.setf(ios::right);
    cout<<"文件名\t\t文件大小\t创建时间戳\n";
    for(int i=0;i<pCurDir->dir.file.size();i++){
        cout<<pCurDir->dir.file[i].filename<<"\t\t"<<pCurDir->dir.file[i].size<<"\t\t"<<pCurDir->dir.file[i].time<<endl;
    }
        cout.unsetf(ios::right);
    cout<<"-------------------------------------------------------------------"<<endl;
}

void Welcome(){
    cout<<"-------------------------------------------------------------------"<<endl;
    cout<<"欢迎使用文件系统"<<endl;
    cout<<"输入help以查看帮助"<<endl;
    cout<<"-------------------------------------------------------------------"<<endl;
}
```

