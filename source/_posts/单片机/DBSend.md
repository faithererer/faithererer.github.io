---
title: MSP430单片机课设
tags: [单片机,MSP430]
mathjax: true
cover: https://vip1.loli.io/2022/05/11/kCaVerHGuztlLM4.jpg
categories: 
description: 记录大二下学期的单片机课设，采用MSP430f169+esp8266+ds18b20+阿里云实现远程温度监视
date: 2023-06-18 22:16:12
---

我们组完成的项目是远程温度检测系统设计。





# 要实现的东西

课设要做温度监视并且通过串口发送到PC和阿里云。主要功能是通过ds18b20传感器获取温度信息传给单片机，然后单片机通过串口给pc发送温度信息，同时给esp8266发送指令将温度信息上传到阿里云。

材料:

- DS18B20温度传感器
- MSP430f169
- esp8266
- 杜邦线

# 学习一下DS18B20

ds18b20是一个单总线的传感器，只通过一个引脚DQ便可进行数据传输。

- 测温范围为-55℃到+125℃，在-10℃到+85℃范围内误差为±0.4°。
- 返回16位二进制温度数值

引脚图：

![image-20230630163247929](https://blog-faithererer.oss-cn-qingdao.aliyuncs.com/blog/typoraImg202306302008086.png)



内部由 **64 位ROM，高速暂存器，存储器** 组成。

- 64位ROM

	64 位ROM存储独有的序列号。

	ROM中的64位序列号是出厂前被光刻好的，它可以看作是该DS18B20的地址序列码，每个DS18B20的64位序列号均不相同。这样就可以实现一根总线上挂接多个DS18B20的目的。（但是我们不挂载多个）

- 高速暂存器
	- 温度传感器
	- 一个字节的温度上限和温度下限报警触发器(TH和TL)
	- **配置寄存器允许用户设定9位，10位，11位和12位的温度分辨率，分别对应着温度的分辨率为：0.5°C，0.25°C，0.125°C，0.0625°C，默认为12位分辨率，**

- 存储器：由一个高速的RAM和一个可擦除的EEPROM组成，EEPROM存储高温和低温触发器(TH和TL)以及配置寄存器的值，(就是存储低温和高温报警值以及温度分辨率)

![image-20230630170054847](https://blog-faithererer.oss-cn-qingdao.aliyuncs.com/blog/typoraImg202306302007739.png)

高速暂存器由9个字节组成

- 字节0~1 是温度存储器，用来存储转换好的温度。第0个字节存储温度低8位，第一个字节存储温度高8位
- 字节2~3 是用户用来设置最高报警和最低报警值(TH和TL)。
- 字节4 是配置寄存器，用来配置转换精度，可以设置为9~12 位。
- 字节5~7 保留位。芯片内部使用
- 字节8 CRC校验位。是64位ROM中的前56位编码的校验码。由CRC发生器产生。

## 温度存储机制

DS18B20的核心功能是直接温度-数字测量。其温度转换可由用户自定义为9、10、11、12位精度分别为0.5℃、0.25℃、0.125℃、0.0625℃分辨率。DS18B20采用16位补码的形式来存储温度数据，温度是摄氏度。当温度转换命令发布后，经转换所得的温度值以二字节补码形式存放在高速暂存存储器的第0和第1个字节。

高字节的五个S为符号位，温度为正值时S=1,温度为负值时S=0

剩下的11位为温度数据位，对于12位分辨率，所有位全部有效，对于11位分辨率，位0(bit0)无定义，对于10位分辨率，位0和位1无定义,对于9位分辨率，位0，位1，和位2无定义。
![image-20230630170742227](https://blog-faithererer.oss-cn-qingdao.aliyuncs.com/blog/typoraImg202306302007871.png)

![image-20230630170857707](https://blog-faithererer.oss-cn-qingdao.aliyuncs.com/blog/typoraImg202306302007294.png)

## 配置寄存器

![image-20230630171111477](https://blog-faithererer.oss-cn-qingdao.aliyuncs.com/blog/typoraImg202306302007877.png)

在配置寄存器中，我们可以通过R0和R1设置DS18B20的转换分辨率，DS18B20在上电后默认R0=1和R1=1(12分辨率)，寄存器中的第7位和第0位到4位保留给设备内部使用。

## 工作步骤

DS18B20的工作步骤可以分为三步：

1.初始化DS18B20
2.执行ROM指令
3.执行DS18B20功能指令

**其中第二步执行ROM指令，也就是访问每个DS18B20，搜索64位序列号，读取匹配的序列号值，然后匹配对应的DS18B20，如果我们仅仅使用单个DS18B20，可以直接跳过ROM指令。而跳过ROM指令的字节是0xCC。**

### 1.初始化DS18B20

![image-20230630171557953](https://blog-faithererer.oss-cn-qingdao.aliyuncs.com/blog/typoraImg202306302007086.png)

DQ管脚的常态是高电平。

根据时序图我们得出初始化的步骤：

- 1.单片机拉低总线至少480us，产生复位脉冲，然后释放总线（拉高电平）转为接收模式。
- 2.这时DS8B20检测到请求之后，会拉低信号，大约持续60\~240us表示应答。
- 3.DS8B20拉低电平的60~240us之间，单片机读取总线的电平，如果是低电平，那么表示初始化成功
- 4.DS18B20拉低电平60~240us之后，会释放总线。

根据此我们可以写出MSP430的初始化代码(我把DQ接到了单片机的P10端口)：

```c
void DS18B20_Reset(){
  unsigned int x=0;
  DQDIR|=BIT0;//输出模式
  DQOUT&=~BIT0;//拉低电平,单片机拉低总线至少480us
  delay_us(500);
  DQOUT|=BIT0;//拉高电平
  delay_us(70); //60-240内
}

unsigned int DS18B20_Check(){
  int retry=0;
  DQDIR&=~BIT0;//置为输入模式，DS18B20会拉低电平
  while((DQIN&BIT0)&&retry<270){
    delay_us(1);
    retry++;
  }
  if(retry>=270){//检测是否拉低了电平
    delay_us(240);
    return 1; //没拉
  }
  else{
    delay_us(240);
    return 0; //拉了
  }
}
```

### 2.执行ROM指令

我们首先需要掌握，如何向DS18B20写数据。

![image-20230630173848300](https://blog-faithererer.oss-cn-qingdao.aliyuncs.com/blog/typoraImg202306302007165.png)

**总线控制器通过控制单总线高低电平持续时间从而把逻辑1或0写DS18B20中。每次只传输1位数据**

根据时序图我们得出以下结论

**写0**:

- 1.拉低总线持续60-120us
- 2.释放总线(拉高电平)

**写1:**

- 拉低总线2-15us
- 释放总线

代码实现:

```c
void DS_Write_Byte(unsigned char data){
  DQDIR|=BIT0;
  unsigned char temp;    
  for(int i=0;i<8;i++){
    temp=data&0x01;//处理位：最低位，通过移位来L-H逐位处理
    data>>=1;
    if(temp){//1
       DQOUT&=~BIT0;//拉低
       delay_us(2);
       DQOUT|=BIT0;//拉高
       delay_us(70);
    }
    else{//0
       DQOUT&=~BIT0;//拉低
       delay_us(70);
       DQOUT|=BIT0;//拉高
       delay_us(2);
    }
  }
}
```

掌握了写操作，我们还需要知道写什么：

常用的是：

**跳过ROM0xCC**

**温度转换 0x44**

> 开启温度读取转换，读取好的温度会存储在高速暂存器的第0个和第一个字节中

**读取温度 0xBE**

> 读取高速暂存器存储的数据（共9个Byte）



**对于本步骤我们选择直接跳过ROM指令**

### 3.执行DS18B20功能指令

在此之前我们先了解以下怎么读DS18B20来自的数据

**读操作和写操作一样，也是按位读取，从低位向高位**

![image-20230630175657075](https://blog-faithererer.oss-cn-qingdao.aliyuncs.com/blog/typoraImg202306302007647.png)

根据时序图，我们总结如下步骤

- 拉低总线至少1us，然后释放总线
- 开始读取，在一个读时隙内，若为1则释放总线为高电平，若为0则拉低电平。

因此代码这样写:

```c

unsigned char DS_Read_Bit(){
  unsigned char data;
  DQDIR|=BIT0;//输出模式
  DQOUT&=~BIT0;//拉低
  delay_us(2);  
  DQOUT|=BIT0;//拉高，释放总线
  
  DQDIR&=~BIT0;//输入
  delay_us(12); 
  if(DQIN&BIT0){
    data=1;
  }
  else{
    data=0;
  }
  delay_us(50); 
  return data;
}

unsigned char DS_Read_Byte(){
   unsigned char data=0,j;
   for(int i=0;i<8;i++){
     data>>=1;
     j=DS_Read_Bit();
     if(j){
      data|=0x80; 
     }
     delay_us(30);    
   }
   return data;
}
```

实现了以上函数我们就可以从DS18B20取出温度的数据了：

```c
short Read_Temper(){
  unsigned char TH,TL,sign=0;
  short tem;
  DS18B20_Start() ;
  DS18B20_Reset(); //DS18B20复位
  DS18B20_Check();	 
  DS_Write_Byte(0xcc);	// skip rom
  DS_Write_Byte(0xbe);	// convert
delay_us(750);//等待转换
  TL=DS_Read_Byte();
  TH=DS_Read_Byte();
  if(TH<<8){//负数，获取原码
    TH=~TH;
    TL=~TL;
    sign=1;
  }
  tem=TH;
  tem<<=8;
  tem+=TL;
  
   //(((TH<<8) | TL)*0.0625);
  tem=(float)tem*0.625;
  if(sign){
    return -tem;  
  }
  else return tem;

}
```

**一个疑点：为什么得到的数值要乘0.625呢？**

关于这个我思考了很久，一直在想0.625和12位分辨率的关系，结果发现官方文档里写了他们的对应关系，也就是说这不是算出来的是规定的，这也推出了一些结论：

小数位是低四位因为 $2^{-4}=0.0625$ 也就是说，寄存器内每步进1相当于温度步进0.0625。因需要如此处理，而代码中乘0.625是原来真实的值扩大了十倍，最后取整相当于保留了小数点后一位。而`（float）expression`的作用则是使计算更精确。

![image-20230630195438080](https://blog-faithererer.oss-cn-qingdao.aliyuncs.com/blog/typoraImg202306302007038.png)

# 学习一下串口

司马自动更新操你妈

[串口通信](https://baike.baidu.com/item/串口通信/3775296?fromModule=lemma_inlink)(Serial Communication)， 是指外设和计算机间，通过数据[信号线](https://baike.baidu.com/item/信号线/8807477?fromModule=lemma_inlink) 、地线、控制线等，按位进行传输数据的一种通讯方式。

**UART**是通用异步收发传输器（Universal Asynchronous Receiver/Transmitter)，通常称作UART，是一种异步收发传输器,是设备间进行异步通信的关键模块。UART负责处理数据总线和串行口之间的串/并、并/串转换，并规定了帧格式；通信双方只要采用相同的帧格式和波特率，就能在未共享时钟信号的情况下，仅用两根信号线（Rx 和Tx）就可以完成通信过程，因此也称为异步串行通信。

## MSP430UART初始化配置步骤:

- `SWRT`复位(UxCTL)

	该位的状态影响着其他一些控制位和状态位的状态。在串行口的使用过程中，这一位是比较重要的控制位。一次正确的 USART 模块初始化应该是这样的顺序：先在 SWRST=1 情况下设置串行口；然后设置
	SWRST=0；最后如果需要中断，则设置相应的中断使能。  

	<table>
	    <tr>
	        <td>SWRT</td><td>0</td>
	    </tr>
	    <tr>
	    		<td>SWRT</td><td>1</td>
	    </tr>
	</table>

- 设置字符长度`CHAR`(UxCTL)

	<table>
	    <tr>
	        <td>0</td><td>7位</td>
	    </tr>
	    <tr>
	    		<td>1</td><td>8位</td>
	    </tr>
	</table>

- 设置串口时钟`SSEL`(UxTCTL )

	这两位确定波特率发生器的时钟源  

	<table>
	        <tr>
	                <td>0</td><td>外部时钟 UCLKI</td>
	        </tr>
	        <tr>
	                <td>1</td><td>辅助时钟 ACLK</td>
	        </tr>
	        <tr>
	                <td>2</td><td>子系统时钟 SMCLK</td>
	        </tr>
	        <tr>
	                <td>3</td><td>子系统时钟 SMCLK</td>
	        </tr>
	</table>

- 设置波特率寄存器UxBRx

	UxBR0 和 UxBR1 两个寄存器用于存放波特率分频因子的整数部分。
	其中 UXBR0 位低字节，UXBR1 为高字节。两字节和起来为一个 16 位字，成为 UBR。在异步通信时，UBR 的允许值不小于 3。如果 UBR<3，则接收和发送会发生不可预测的错误  

	<table>
	        <tr>
	                <td>UxBR0</td><td>低字节</td>
	        </tr>
	        <tr>
	                <td>UxBR1</td><td>高字节</td>
	        </tr>
	   </table>

- 设置UxMCTL 波特率调整寄存器  

	如果波特率发生器的输入频率BRCLK不是所需的波特率的整数倍，带有一小数，则整数部分写入UBR
	寄存器，小数部分由调整控制寄存器 UxCTL 的内容反映。波特率由以下公式计算：
	波特率 = BRCLK / (UBR+ (M7+M6+..+M0) / 8 )
	其中 M0,M1,…M6 及 M7 为控制器 UxMCTL 中的各位。调整寄存器的 8 为分别对应 8 次分频，如果
	M＝1，则相应次的分频增加一个时钟周期；如果 Mi＝0，则分频计数器不变  

- 配置串口模块控制寄存器` MEx`

	<table>
	        <tr>
	                <td>UTXE0</td><td>串口 0 的发送允许</td>
	        </tr>
	        <tr>
	                <td>URXE0</td><td>串口 0 的接收允许</td>
	        </tr>
	        <tr>
	                <td>UTXE1</td><td>串口 1 的发送允许</td>
	        </tr>
	        <tr>
	                <td>URXE1</td><td>串口 1 的接收允许</td>
	        </tr>
	          <tr>
	                <td>0</td><td>禁止</td>
	        </tr>
	           <tr>
	                <td>1</td><td>允许</td>
	        </tr>
	</table>

- SWRST=0

- 配置接收中断控制`IE`

	<table>
	        <tr>
	                <td>UTXIE0</td><td>串口 0 的发送中断允许</td>
	        </tr>
	        <tr>
	                <td>URXIE0</td><td>串口 0 的接收中断允许</td>
	        </tr>
	        <tr>
	                <td>UTXIE1</td><td>串口 1 的发送中断允许</td>
	        </tr>
	        <tr>
	                <td>URXIE1</td><td>串口 1 的接收中断允许</td>
	        </tr>
	          <tr>
	                <td>0</td><td>禁止</td>
	        </tr>
	           <tr>
	                <td>1</td><td>允许</td>
	        </tr>
	</table>

- 设置IO口为普通I/O模式，设置IO口方向为输出

	```c
	  P3SEL|= BIT4;               //设置IO口为普通I/O模式
	  P3DIR|= BIT4;               //设置IO口方向为输出
	  P3SEL|= BIT5;
	```

	

实例

```c
void UART0_Init()
{
  /**
   * 该位的状态影响着其他一些控制位和状态位的状态。在串行口的使用过程中，这一位是比较重要的控
  制位。一次正确的 USART 模块初始化应该是这样的顺序：先在 SWRST=1 情况下设置串行口；然后设置
  SWRST=0；最后如果需要中断，则设置相应的中断使能。
  */
  U0CTL|=SWRST;               //复位SWRST
  U0CTL|=CHAR;                //8位数据模式 
  U0TCTL|=SSEL1;              //SMCLK为串口时钟

  U0BR1=baud_h;               //BRCLK=8MHZ,Baud=BRCLK/N
  U0BR0=baud_l;               //N=UBR+(UxMCTL)/8
  U0MCTL=0x00;                //微调寄存器为0，波特率9600bps
  ME1|=UTXE0;                 //UART1发送使能
  ME1|=URXE0;                 //UART1接收使能
  U0CTL&=~SWRST;
  IE1|=URXIE0;                //接收中断使能位
  
  P3SEL|= BIT4;               //设置IO口为普通I/O模式
  P3DIR|= BIT4;               //设置IO口方向为输出
  P3SEL|= BIT5;
}
```

## 发送函数

IFG1 中断标志寄存器 1
IFG2 中断标志寄存器 2

<table>
        <tr>
                <td>UTXIFG0</td><td>串口 0 的发送中断标志</td>
        </tr>
        <tr>
                <td>URXIFG0</td><td>串口 0 的接收中断标志</td>
        </tr>
        <tr>
                <td>UTXIFG1</td><td>串口 1 的发送中断标志</td>
        </tr>
        <tr>
                <td>URXIFG1</td><td>串口 1 的接收中断标志</td>
        </tr>
          <tr>
                <td>0</td><td>无中断请求标志</td>
        </tr>
           <tr>
                <td>1</td><td>有中断请求标志</td>
        </tr>
</table>

```c
void Send_Byte(uchar data)
{
  while((IFG1&UTXIFG0)==0);          //发送寄存器空的时候发送数据
    U0TXBUF=data;
}

void Print_Str(uchar *s)
{
    while(*s != '\0')
    {
        Send_Byte(*s++);
    }
}
```

**相应的中断函数**

```c
//接收中断
#pragma vector=UART0RX_VECTOR
__interrupt void UART0_RX_ISR(void)
{
  uchar data=0;
  data=U0RXBUF;                       //接收到的数据存起来
  Send_Byte(data);                    //将接收到的数据再发送出去
}
```



## 一个问题

我的温度数据是short型两个字节，而串口是按字节逐位发送如何发送呢？

我目前只能一个字节一个字节的发，结果是整数十六进制的形式

```c
    unsigned char highByte = (tt >> 8) & 0xFF; // 高字节
    unsigned char lowByte = tt & 0xFF; // 低字节
```

（写完整篇后更新）解决了，可以数字转换成字符串形式：

```c

char *Do_Num2Str(short t){
  char str[5]={0x30+t/100,0x30+(t%100-t%10)/10,0x2e,0x30+t%10,'\0'};
  return str;
}
void Send_temp_toPc(short t){
    char* str=Do_Num2Str(t);
    unsigned char v=0x30+(t%100-t%10)/10;
    Send_Str_to_0(str);
}
```





# 学习一下ESP8266

**ESP8266** 是一款由上海[乐鑫信息科技](https://zh.wikipedia.org/w/index.php?title=乐鑫信息科技&action=edit&redlink=1)[[1\]](https://zh.wikipedia.org/wiki/ESP8266开发板#cite_note-Espressif_ESP8266-1)开发的可以作为[微控制器](https://zh.wikipedia.org/wiki/微控制器)使用的成本极低且具有完整[TCP/IP协议栈](https://zh.wikipedia.org/wiki/TCP/IP协议栈)的Wi-Fi [IoT](https://zh.wikipedia.org/wiki/IoT)控制芯片。

**MQTT**：一种通讯协议

我们只是使用，并不关注其原理



## 烧写固件

一般的esp8266芯片需要烧录MQTT固件才能进行连接阿里云的功能



首先在[安信可的网站](https://docs.ai-thinker.com/esp8266)下载固件，和烧录相关程序。



![image-20230703161027070](https://blog-faithererer.oss-cn-qingdao.aliyuncs.com/blog/typoraImg202307050027436.png)



其中esp8266与USB-串口连线如下：

<table>
        <tr>
                <td>TTL</td><td>ESP8266</td>
        </tr>
        <tr>
                <td>3V3</td><td>3V3</td>
        </tr>
        <tr>
                <td>GND</td><td>GND</td>
        </tr>
        <tr>
                <td>GND</td><td>IO0</td>
        </tr>
          <tr>
                <td>RX/TX</td><td>TX/RX</td>
        </tr>
           <tr>
                <td>GND</td><td>RST</td>
        </tr>
</table>



当程序显示`等待上电复位时`让RST接地,然后拉高。

这样就完成了烧录

## 完成与阿里云的通讯

```shell

AT+RST
//用于重置
 
AT+CWMODE=1
//设置当前模式为STA模式
 
AT+CWLAP
//查看当前环境下的WIFI
 
AT+CWJAP="WIFI名称","WIFI密码"



AT+MQTTUSERCFG=0,1,"client_id","username","password",0,0,""
//client_id随便写，username和password填生成的参数
 
AT+MQTTCLIENTID=0,"ClientId"
//ClientId填生成的参数，注意要在每个逗号前加分隔符"\"
 
AT+MQTTCONN=0,"连接域名",1883,1
//连接域名填上面生成的，注意要去掉端口号1883，因为后面已经设置了

```

相关参数由该软件生成。![image-20230703161938924](https://blog-faithererer.oss-cn-qingdao.aliyuncs.com/blog/typoraImg202307050027801.png)

成功之后阿里云的云平台的相关设备会显示在线。

# 与阿里云进行数据交互

## 属性设置

![image-20230703163750214](https://blog-faithererer.oss-cn-qingdao.aliyuncs.com/blog/typoraImg202307050027063.png)





复制内容

```shell
AT+MQTTSUB=0,"topic",1
//"topic"改为我们刚刚复制的内容
///sys/iknjuQejQ6d/${deviceName}/thing/service/property/set
//${deviceName}用我们上文新建设备时候的name
```

成功则显示在下图

![image-20230703164938420](https://blog-faithererer.oss-cn-qingdao.aliyuncs.com/blog/typoraImg202307050027281.png)

## 调试

按顺序操作



![image-20230703165357091](https://blog-faithererer.oss-cn-qingdao.aliyuncs.com/blog/typoraImg202307050027448.png)

可以看见右方返回参数，串口助手也返回了相关信息

## 上报数据

复制该内容

![image-20230703165552998](https://blog-faithererer.oss-cn-qingdao.aliyuncs.com/blog/typoraImg202307050027951.png)

```shell
AT+MQTTPUB=0,"topic","data",1,0
//"topic"选择复制的/sys/iknjuQejQ6d/${deviceName}/thing/event/property/post
//${deviceName}填对应的deviceName
//"data"采用json数据格式，{\"params\":{\"temperature\":20}}，其中temperature为属性的标识符
```

成功上传数据！！！![image-20230703170245805](https://blog-faithererer.oss-cn-qingdao.aliyuncs.com/blog/typoraImg202307050027931.png)

# esp8266与MSP430f149的交互

先找到引脚功能表

![image-20230703183526488](https://blog-faithererer.oss-cn-qingdao.aliyuncs.com/blog/typoraImg202307050027824.png)

UART0在MSP430f169有现成的接口，用于和PC通信，UART1的TXD和RXD分别位于`P36`和`P37`这两个IO接口。

如下初始化设置：

```c
void UART1_Init()
{
  U1CTL|=SWRST;               //复位SWRST
  U1CTL|=CHAR;                //8位数据模式 
  U1TCTL|=SSEL1;              //SMCLK为串口时钟

  U1BR1=0;               //BRCLK=8MHZ,Baud=BRCLK/N
  U1BR0=69;               //N=UBR+(UxMCTL)/8
  U1MCTL=0x00;                //微调寄存器为0，波特率9600bps
  ME2|=UTXE1;                 //UART1发送使能
  ME2|=URXE1;                 //UART1接收使能
  U1CTL&=~SWRST;
  IE2|=URXIE1;                //接收中断使能位
  
  P3SEL|= BIT6;               //设置IO口为普通I/O模式
  P3DIR|= BIT6;               //设置IO口方向为输出
  P3SEL|= BIT7;
}
```

UART1对应esp8266芯片，向其发送数据，相当于对它发送命令，其向主控机返回的信息，可以通过中断函数向UART0发送数据，显示在串口调试助手用于调试。

定义相关功能函数:

```C
void Send_Byte_0(uchar data)//发至UART0
{

  while((IFG1&UTXIFG0)==0);          //发送寄存器空的时候发送数据
    U0TXBUF=data;
}

void Send_Byte_1(uchar data)//发至UART1
{

  while((IFG2&UTXIFG1)==0);          //发送寄存器空的时候发送数据
    U1TXBUF=data;
}


void Send_Str_to_0( uchar *s)//发至UART1
{
    while(*s != '\0')
    {
        Send_Byte_0(*s++);
    }

}
void Send_Str_to_1( char *s)//发至UART1
{
    while(*s != '\0')
    {
        Send_Byte_1(*s++);
    }

}


//接收中断
#pragma vector=UART1RX_VECTOR
__interrupt void UART1_RX_ISR(void)
{
  uchar data;
  data=U1RXBUF;                       //接收到的数据存起来
  Send_Byte_0(data);                    //将接收到的数据再发送出去

}

//接收中断
#pragma vector=UART0RX_VECTOR
__interrupt void UART0_RX_ISR(void)
{
  uchar data;
  data=U0RXBUF;                       //接收到的数据存起来
  Send_Byte_0(data);                    //将接收到的数据再发送出去
}
```

通过以上功能就可以完成向阿里云转发上传温度数据了！

完整代码：

```c
#include <msp430f169.h>
#include "Config.h"
#define DQOUT P1OUT
#define DQDIR P1DIR
#define DQIN P1IN

void Port_init()
{

	P4SEL = 0x00;
  P4DIR = 0xFF;                   //数据口输出模式
  P5SEL = 0x00;
  P5DIR|= BIT5 + BIT6 + BIT7;     //控制口设置为输出模式
}
void DS18B20_Reset(){
  unsigned int x=0;
  DQDIR|=BIT0;//输出模式
  DQOUT&=~BIT0;//拉低电平,单片机拉低总线至少480us
  delay_us(500);
  DQOUT|=BIT0;//拉高电平
  delay_us(70); //60-240内
}

unsigned int DS18B20_Check(){
  int retry=0;
  DQDIR&=~BIT0;//置为输入模式，DS18B20会拉低电平
  while((DQIN&BIT0)&&retry<270){
    delay_us(1);
    retry++;
  }
  if(retry>=270){//检测是否拉低了电平
    delay_us(240);
    return 1; //没拉
  }
  else{
    delay_us(240);
    return 0; //拉了
  }
}
/**
1.单片机拉低总线至少480us，产生复位脉冲，然后释放总线（拉高电平）。
2.这时DS8B20检测到请求之后，会拉低信号，大约60~240us表示应答。
3.DS8B20拉低电平的60~240us之间，单片机读取总线的电平，如果是低电平，那么表示初始化成功
4.DS18B20拉低电平60~240us之后，会释放总线。
*/

void DS_Write_Byte(unsigned char data){
  DQDIR|=BIT0;
  unsigned char temp;    
  for(int i=0;i<8;i++){
    temp=data&0x01;//处理位：最低位，通过移位来L-H逐位处理
    data>>=1;
    if(temp){//1
       DQOUT&=~BIT0;//拉低
       delay_us(2);
       DQOUT|=BIT0;//拉高
       delay_us(70);
    }
    else{//0
       DQOUT&=~BIT0;//拉低
       delay_us(70);
       DQOUT|=BIT0;//拉高
       delay_us(2);
    }
  }
}

unsigned char DS_Read_Bit(){
  unsigned char data;
  
  DQDIR|=BIT0;


  DQOUT&=~BIT0;//拉低
  delay_us(2);  
  DQOUT|=BIT0;//拉高，释放总线
  
  DQDIR&=~BIT0;//输入
  delay_us(12); 
  if(DQIN&BIT0){
    data=1;
  }
  else{
    data=0;
  }
  delay_us(50); 
  return data;
}

unsigned char DS_Read_Byte(){
   unsigned char data=0,j;
   for(int i=0;i<8;i++){
     data>>=1;
     j=DS_Read_Bit();
     if(j){
      data|=0x80; 
     }
     delay_us(30);    
   }
   return data;
   
}

void UART0_Init()
{
  /**
   * 该位的状态影响着其他一些控制位和状态位的状态。在串行口的使用过程中，这一位是比较重要的控
  制位。一次正确的 USART 模块初始化应该是这样的顺序：先在 SWRST=1 情况下设置串行口；然后设置
  SWRST=0；最后如果需要中断，则设置相应的中断使能。
  */
  U0CTL|=SWRST;               //复位SWRST
  U0CTL|=CHAR;                //8位数据模式 
  U0TCTL|=SSEL1;              //SMCLK为串口时钟

  U0BR1=0;               //BRCLK=8MHZ,Baud=BRCLK/N
  U0BR0=69;               //N=UBR+(UxMCTL)/8
  U0MCTL=0x00;                //微调寄存器为0，波特率9600bps
  ME1|=UTXE0;                 //UART1发送使能
  ME1|=URXE0;                 //UART1接收使能
  U0CTL&=~SWRST;
  IE1|=URXIE0;                //接收中断使能位
  
  P3SEL|= BIT4;               //设置IO口为普通I/O模式
  P3DIR|= BIT4;               //设置IO口方向为输出
  P3SEL|= BIT5;
}
void UART1_Init()
{
  U1CTL|=SWRST;               //复位SWRST
  U1CTL|=CHAR;                //8位数据模式 
  U1TCTL|=SSEL1;              //SMCLK为串口时钟

  U1BR1=0;               //BRCLK=8MHZ,Baud=BRCLK/N
  U1BR0=69;               //N=UBR+(UxMCTL)/8
  U1MCTL=0x00;                //微调寄存器为0，波特率9600bps
  ME2|=UTXE1;                 //UART1发送使能
  ME2|=URXE1;                 //UART1接收使能
  U1CTL&=~SWRST;
  IE2|=URXIE1;                //接收中断使能位
  
  P3SEL|= BIT6;               //设置IO口为普通I/O模式
  P3DIR|= BIT6;               //设置IO口方向为输出
  P3SEL|= BIT7;
}
void Send_Byte_0(uchar data)
{

  while((IFG1&UTXIFG0)==0);          //发送寄存器空的时候发送数据
    U0TXBUF=data;
}

void Send_Byte_1(uchar data)
{

  while((IFG2&UTXIFG1)==0);          //发送寄存器空的时候发送数据
    U1TXBUF=data;
}


void Send_Str_to_0( uchar *s)
{
    while(*s != '\0')
    {
        Send_Byte_0(*s++);
    }

}
void Send_Str_to_1( char *s)
{
    while(*s != '\0')
    {
        Send_Byte_1(*s++);
    }

}

void DS18B20_Start(void) 
{   						               
  DS18B20_Reset();	   
  aa=DS18B20_Check();	 
  DS_Write_Byte(0xcc);	// skip rom
  DS_Write_Byte(0x44);	// convert
} 

short Read_Temper(){
  unsigned char TH,TL,sign=0;
  short tem;
  DS18B20_Start() ;
  DS18B20_Reset(); //DS18B20复位
  DS18B20_Check();	 
  DS_Write_Byte(0xcc);	// skip rom
  DS_Write_Byte(0xbe);	// convert
  delay_us(750);//等待转换
  TL=DS_Read_Byte();
  TH=DS_Read_Byte();
  if(TH<<8){
    TH=~TH;
    TL=~TL;
    sign=1;
  }
  tem=TH;
  tem<<=8;
  tem+=TL;
  
  
   //(((TH<<8) | TL)*0.0625);
  tem=(float)tem*0.625;
  if(sign){
    return -tem;  
  }
  else return tem;

}


void Display_Temp(short t){
  unsigned char data[10];
  if(t<0){
    LCD_write_char(0,1,'-');
    t=-1*t;
  }
  unsigned char sw,gw,xs1,xs2;
  short bt=t;
  xs1=bt%10;
  gw=(bt%100-bt%10)/10;
  sw=bt/100;
  LCD_write_char(1,1,0x30+sw);
  LCD_write_char(2,1,0x30+gw);
  LCD_write_char(3,1,'.');
  LCD_write_char(4,1,0x30+xs1);
  delay_ms(1000); 
}
char *my_strcat(char *str1, char *str2)
{
    char* result; 
    while (*str1 != '\0') {
        *result = *str1;
        result++;
        str1++;
    }
    
    while (*str2 != '\0') {
        *result = *str2;
        result++;
        str2++;
    }
    
    *result = '\0'; // 在结果字符串末尾添加字符串结束标志
    return result;
}

char *Do_Num2Str(short t){
  
  char str[5]={0x30+t/100,0x30+(t%100-t%10)/10,0x2e,0x30+t%10,'\0'};

  return str;
}

void Send_temp_toPc(short t){
    char* str=Do_Num2Str(t);
    //Send_Byte_0(0x30+t/100);
    unsigned char v=0x30+(t%100-t%10)/10;
    //Send_Byte_0(v);
    //Send_Byte_0(0x2e);
    //Send_Byte_0(0x30+t%10);
    Send_Str_to_0(str);
}

void WIFI_GOT(){
  delay_ms(3000);
  Send_Str_to_1("AT+CWJAP=\"SSID\",\"PWD\"\r\n"); 
  delay_ms(6000);
}
void Aliyun_conn(){
  
  Send_Str_to_1("AT+MQTTUSERCFG=0,1,\"NULL\",\"DEVICENAME\",");
  Send_Str_to_1("\"\",0,0,\"\"\r\n");
  delay_ms(5000);
  Send_Str_to_1("AT+MQTTCLIENTID=0,\"\r\n");
  delay_ms(5000);
  Send_Str_to_1("AT+MQTTCONN=0,\",1883,1\r\n"); 
  delay_ms(5000);
}


int main( void )
{
  int flag=0;
  // Stop watchdog timer to prevent time out reset
  WDTCTL = WDTPW + WDTHOLD;
  Clock_Init();                       //系统时钟设置
  Port_init();
  UART0_Init();
  UART1_Init();
  delay_ms(100); 
  LCD_init();                         //液晶参数初始化设置
  LCD_clear();                     //清屏
  _EINT();
  delay_ms(5000);
  WIFI_GOT();
  Aliyun_conn();
  while(1){
    delay_ms(1000);
    short t=Read_Temper();
    if(aa==0){
      LCD_write_str(0,0,"ok"); 
      delay_ms(1000);
    }
    else if(aa==1){
      LCD_write_str(0,0,"no"); 
      delay_ms(1000);
    }

    
    Send_temp_toPc(t);
    Display_Temp(t);
    char* temS=Do_Num2Str(t);
    if(flag){
      Send_Str_to_1("AT+MQTTPUB=0,\"/sys/a1grBfxFQal/esp8266/thing/event/property/post\",\"{\\\"params\\\":{\\\"CurrentTemperature\\\":");
      Send_Str_to_1(temS);
      Send_Str_to_1("}}\",1,0\r\n");
    }
    LCD_clear();
    delay_ms(1000); 
    flag=1;
  }
  return 0;
}



//接收中断
#pragma vector=UART1RX_VECTOR
__interrupt void UART1_RX_ISR(void)
{
  uchar data;
  data=U1RXBUF;                       //接收到的数据存起来
  Send_Byte_0(data);                    //将接收到的数据再发送出去

}

//接收中断
#pragma vector=UART0RX_VECTOR
__interrupt void UART0_RX_ISR(void)
{
  uchar data;
  data=U0RXBUF;                       //接收到的数据存起来
  Send_Byte_0(data);                    //将接收到的数据再发送出去
}
```



通过阿里云平台`IoT Sutdio`可以开发一个物联网APP来方便查看温度

![image-20230705003904473](https://blog-faithererer.oss-cn-qingdao.aliyuncs.com/blog/typoraImg202307050042551.png)



# 电路图

![image-20230705132215490](https://blog-faithererer.oss-cn-qingdao.aliyuncs.com/blog/typoraImg202307051322217.png)

**An unforgettable journey！！！**

