(print (requireRun "../examples/runJS" "say_hello"))
(define say_hello (getValue (require "../examples/runJS") "say_hello"))
(print (say_hello))
