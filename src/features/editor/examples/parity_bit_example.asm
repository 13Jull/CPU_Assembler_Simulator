;	Parity Bit Example (Parity Watchdog)
;---------------------------------------
; Parity watchdog over "Hello World!"
; Data bytes:  HELLO_STR .. HELLO_STR+0C
; (12 chars + 00 terminator = 13 bytes)
; Stored parity byte at RAM[70]
;
; Registers used:
;   AL = temp / video RAM pointer
;   BL = pointer to current RAM address (string)
;   CL = running parity accumulator
;   DL = loop counter (number of data bytes)
;---------------------------------------

INITIALIZE_MEMORY:
        ; Jump over embedded string data so we don't execute it
        JMP     INIT_PARITY_CHECKING_INITIALIZATION

; String stored immediately after the jump
HELLO_STR:
        DB "Hello World!"
        DB 00              ; Null terminator

;--------------------------------------
; Initial parity computation
;--------------------------------------
INIT_PARITY_CHECKING_INITIALIZATION:
        ; Initialise parity accumulator and pointers
        MOV     CL,00          ; CL = 0, start parity at zero
        MOV     BL,02   ; BL = base address of data block ("Hello World!")
        MOV     DL,0D          ; DL = number of data bytes (Length of "Hello World!" + 00)

INIT_PARITY_LOOP:
        MOV     AL,[BL]        ; AL = RAM[BL] = next character
        XOR     CL,AL          ; CL = CL XOR AL (update parity)
        INC     BL             ; next character
        DEC     DL             ; one less byte to process
        JNZ     INIT_PARITY_LOOP

        ; When DL = 0, CL holds the parity of all bytes in the string
        MOV     [70],CL        ; Store parity byte at RAM[70]

        JMP     MAIN_LOOP


;--------------------------------------
; MAIN LOOP: print string to video RAM,
; then check parity, repeat
;--------------------------------------
MAIN_LOOP:
        ; Set up video RAM pointer and string pointer
        MOV     AL,0C0         ; AL points to start of video RAM
        MOV     BL,02   ; BL points to first character in the string
        MOV     CL,[BL]        ; CL = first character

PRINTING:
        MOV     [AL],CL        ; Write character in CL to video RAM at [AL]
        INC     AL             ; Next video RAM location
        INC     BL             ; Next character in the string
        MOV     CL,[BL]        ; Load next character
        CMP     CL,00          ; Check for null terminator
        JNZ     PRINTING       ; If not 00, keep printing

        ; When we reach 00, string is fully printed
        JMP     PARITY_CHECKING_INITIALIZATION


;--------------------------------------
; Parity checking watchdog
;--------------------------------------
PARITY_CHECKING_INITIALIZATION:
        ; Initialise parity accumulator and pointers
        MOV     CL,00          ; CL = 0, start parity at zero
        MOV     BL,02   ; BL = base address of string
        MOV     DL,0D          ; DL = number of bytes to check

PARITY_CHECK:
        MOV     AL,[BL]        ; AL = RAM[BL]
        XOR     CL,AL          ; CL = CL XOR AL (update parity)
        INC     BL             ; move to next byte
        DEC     DL             ; one less byte to process
        JNZ     PARITY_CHECK   ; loop until DL == 0

        ; At this point CL holds recomputed parity over "Hello World!" + 00
        CMP     CL,[70]        ; compare CL with stored parity at RAM[70]
        JZ      MAIN_LOOP      ; if equal, no error → print again and re-check

;--------------------------------------
; If we reach here, parity mismatch = error detected
;--------------------------------------
ERROR_LOOP:
        JMP     ERROR_LOOP     ; stay here forever on error

;--------------------------------------
        END
;--------------------------------------
