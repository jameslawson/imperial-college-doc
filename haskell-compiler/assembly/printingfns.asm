;-------This file provides printing library functions. --------------
;------- These procedures were taken from our first year MatMult exercise,
;-------              written by Richard Hayden                  

global readnumber
global output_char
global output_int
global os_return
global outfunc
global infunc
global stringtoint
global fmt
global frs
global readnumtempstr
extern scanf
extern printf
extern  atoi



        SECTION .data              ; Data section, initialized variables
        octetbuffer	DQ 0		       ; (qword as choice of size on stack)


        fmt:               dq      `%s\n`,10, 0   ; Printing strings
        frs:               dq      "%s", 10, 0    ; Used for reading strings
        readnumtempstr:    dq      "%d", 10, 0    ; Used for printing numbers



;-------------------------------------------------------------------------------
;-------------------------------------------------------------------------------
;-------------------------------------------------------------------------------
;-------------------------------------------------------------------------------
;-------------------------------------------------------------------------------
;-------------------------------------------------------------------------------

outfunc:
        push    rbp
        mov     rbp,rsp
        push r9
        push r8
        push rcx
        push rdx
        push rsi
        push rdi


        mov     rsi, [rbp+16]
        mov     rdi, fmt
        call    printf          ; Call C function

        pop rdi
        pop rsi
        pop rdx
        pop rcx
        pop r8
        pop r9
        mov rsp, rbp
        pop rbp
        ret


infunc:
        push    rbp
        mov     rbp,rsp
        push r9
        push r8
        push rcx
        push rdx
        push rsi
        push rdi


        mov     rsi, [rbp+16]
        mov     rdi, frs
        call    scanf          ; Call C function

        pop rdi
        pop rsi
        pop rdx
        pop rcx
        pop r8
        pop r9
        mov rsp, rbp
        pop rbp
        ret



stringtoint:
        push    rbp
        mov     rbp,rsp
        push r9
        push r8
        push rcx
        push rdx
        push rsi
        push rdi


        mov     rdi, [rbp+16]
        call    atoi 

        pop rdi
        pop rsi
        pop rdx
        pop rcx
        pop r8
        pop r9
        mov rsp, rbp
        pop rbp
        ret

readnumber:
      push rbp
      mov rbp, rsp
      push qword readnumtempstr
      call infunc
      push qword readnumtempstr
      call stringtoint
      mov rsp, rbp
      pop rbp
      ret

; ------------------------------------------------------------------------------
; ------------------------------------------------------------------------------
; ------------------------------------------------------------------------------
; ------------------------------------------------------------------------------
; --____--_-----_-----__------------------_---_---------------------------------
; -/ __ \| |---| |---/ _|----------------| |-(_)--------------------------------
; | |  | | | __| |--| |_ _ - _-_ __---___| |_ _  ___- _-__--___-----------------
; | |  | | |/ _` |--|  _| | | | '_ \ / __| __| |/ _ \| '_ \/ __|----------------
; | |__| | | (_| |  | | | |_| | | | | (__| |_| | (_) | | | \__ \----------------
; -\____/|_|\__,_|  |_|  \__,_|_| |_|\___|\__|_|\___/|_| |_|___/----------------
; ------------------------------------------------------------------------------
; ------------------------------------------------------------------------------
; ------------------------------------------------------------------------------
; ------------------------------------------------------------------------------

os_return:
	call output_newl; Always output a newline before exiting
	mov  rax, 1		; Linux system call 1 i.e. exit ()
	mov  rbx, 0		; Error code 0 i.e. no errors
	int  80H		; Interrupt Linux kernel

output_newl:
	push qword 10
	call output_char
	add rsp, 8
  ret

output_str:
  push rcx

  mov rdx, [rsp+24]
  mov rcx, [rsp+16]
  mov rbx, 1
  mov rax, 4
  int 0x80

  pop rcx

  ret

output_char:			; void output_char (ch)
   push RAX
   push rbx
   push rcx
   push rdx
	 push r8		; r8..r11 are altered by Linux kernel interrupt
	 push r9
	 push r10
	 push r11
	 push qword [octetbuffer] ; (just to make output_char() re-entrant...)

	 mov  rax, 4		; Linux system call 4; i.e. write ()
	 mov  rbx, 1	; File descriptor 1 i.e. standard output
	 mov  rcx, [rsp+80]	; fetch char from non-I/O-accessible segment
	 mov  [octetbuffer], rcx	; load into 1-octet buffer
   lea  rcx, [octetbuffer]	; Address of 1-octet buffer
   mov  rdx, 1		; Output 1 character only
	 int  80H		; Interrupt Linux kernel

	 pop qword [octetbuffer]
	 pop  r11
	 pop  r10
	 pop  r9
	 pop  r8
   pop  rdx
   pop  rcx
   pop  rbx
   pop  rax
   ret

output_minus:			; void output_minus()
	push qword '-'
	call output_char
	add  rsp, 8
         ret



output_int:                     ; void output_int (int N)
         push rbp
         mov  rbp, rsp

         ; rax=N then N/10, rdx=N%10, rbx=10

         push rax                ; save registers
         push rbx
         push rdx

         cmp  qword [rbp+16], 0 ; minus sign for negative numbers
         jge  L88

         call output_minus
         neg  qword [rbp+16]

L88:
         mov  rax, [rbp+16]       ; rax = N
         mov  rdx, 0              ; rdx:rax = N (unsigned equivalent of "cqo")
         mov  rbx, 10
         idiv rbx                ; rax=N/10, rdx=N%10

         cmp  rax, 0              ; skip if N<10
         je   L99

         push rax                ; output.int (N / 10)
         call output_int
         add  rsp, 8

L99:
         add  rdx, '0'           ; output char for digit N % 10
         push rdx
         call output_char
         add  rsp, 8

         pop  rdx                ; restore registers
         pop  rbx
         pop  rax
         pop  rbp
         ret
