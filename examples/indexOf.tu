(define indexOf
  (lambda (tup val count) (
    (if (lte (len tup) 0) (
      (- 0 1)
    ) (
      (if (eq (head tup) val) count (
        (indexOf (tail tup) val (+ count 1))
      ))
    ))
  ))
)

(print (indexOf (tuple 1 2 3 4) 2 0))
(print (indexOf "Hello World" "W" 0))
(print (indexOf (tuple 1 2 3 4) 5 0))